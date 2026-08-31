import { motionStore, prefersReducedMotion, watchSystemPreference } from '@core/reducedMotion'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Préférence à trois états (spec §4.8) : `system` / `forced-on` / `forced-off`.
// L'interrupteur du chrome écrase la valeur détectée — c'est un objet d'enseignement,
// visible en permanence, pas un réglage caché.

type MediaListener = (event: { matches: boolean }) => void

const listeners = new Set<MediaListener>()
let systemReduces = false

const installMatchMedia = () => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce') && systemReduces,
    media: query,
    addEventListener: (_: string, listener: MediaListener) => listeners.add(listener),
    removeEventListener: (_: string, listener: MediaListener) => listeners.delete(listener),
  }))
}

/** Simule un changement de la préférence système (réglage d'accessibilité de l'OS). */
const setSystemPreference = (reduces: boolean) => {
  systemReduces = reduces
  for (const listener of listeners) listener({ matches: reduces })
}

let stopWatching: () => void

beforeEach(() => {
  listeners.clear()
  systemReduces = false
  installMatchMedia()
  motionStore.getState().reset()
  stopWatching = watchSystemPreference()
})

afterEach(() => {
  stopWatching()
  vi.unstubAllGlobals()
})

describe('effective preference', () => {
  it('follows the system by default', () => {
    expect(motionStore.getState().preference).toBe('system')
    expect(prefersReducedMotion()).toBe(false)

    setSystemPreference(true)
    expect(prefersReducedMotion()).toBe(true)
  })

  it('lets the chrome switch override a system that does not reduce', () => {
    setSystemPreference(false)
    motionStore.getState().setPreference('forced-on')

    expect(prefersReducedMotion()).toBe(true)
  })

  it('lets the chrome switch override a system that does reduce', () => {
    setSystemPreference(true)
    motionStore.getState().setPreference('forced-off')

    // C'est le point : la préférence système est un défaut, pas une prison.
    expect(prefersReducedMotion()).toBe(false)
  })

  it('returns to the system value when the override is released', () => {
    setSystemPreference(true)
    motionStore.getState().setPreference('forced-off')
    motionStore.getState().setPreference('system')

    expect(prefersReducedMotion()).toBe(true)
  })
})

describe('watching the system', () => {
  it('stops listening once released — nothing survives an unmounted app', () => {
    stopWatching()
    setSystemPreference(true)

    expect(prefersReducedMotion()).toBe(false)
    stopWatching = () => {}
  })
})

describe('reacting to the system', () => {
  it('notices a system change while no override is set', () => {
    const seen: boolean[] = []
    const unsubscribe = motionStore.subscribe(() => seen.push(prefersReducedMotion()))

    setSystemPreference(true)

    expect(seen).toEqual([true])
    unsubscribe()
  })

  it('stays put on a system change while an override is set', () => {
    motionStore.getState().setPreference('forced-off')
    setSystemPreference(true)

    expect(prefersReducedMotion()).toBe(false)
  })
})

describe('the toggle only has two positions', () => {
  it('turns the three states into the two the chrome shows', () => {
    motionStore.getState().toggle()
    expect(prefersReducedMotion()).toBe(true)

    motionStore.getState().toggle()
    expect(prefersReducedMotion()).toBe(false)
  })

  it('leaves `system` behind once the user has touched the switch', () => {
    motionStore.getState().toggle()
    expect(motionStore.getState().preference).not.toBe('system')
  })
})

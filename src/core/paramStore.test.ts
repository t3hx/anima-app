import { paramStore } from '@core/paramStore'
import type { Lesson, Param } from '@core/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Le store est l'unique source de vérité des valeurs (invariant). Il alimente trois
// consommateurs à trois régimes : les contrôles (re-rendu), le moteur d'animation
// (abonnement transitoire, sans re-rendu) et le panneau de code (différé).
// Ce fichier teste le store lui-même ; l'absence de re-rendu est prouvée en T004.

const param = (over: Partial<Param> & Pick<Param, 'id' | 'control' | 'default'>): Param =>
  ({ label: over.id, group: 'group.values', ...over }) as Param

const lesson = (id: string, params: readonly Param[]): Lesson => ({
  id,
  slug: id,
  family: 'native',
  order: 1,
  titleKey: 'lesson.native-tween.title',
  scene: 'webgl',
  transport: 'timeline',
  params,
  code: [],
  animate: () => ({ x: 0, showGhosts: false }),
  timing: () => ({ duration: 2, easing: 'linear' }),
})

const tween = lesson('native-tween', [
  param({ id: 'duration', control: { type: 'slider', min: 0.1, max: 5, step: 0.1 }, default: 2 }),
  param({ id: 'ghosts', control: { type: 'toggle' }, default: true }),
  param({
    id: 'method',
    control: { type: 'choice', options: [{ value: 'to', label: 'to' }] },
    default: 'from',
  }),
])

const easing = lesson('native-easing', [
  param({ id: 'curve', control: { type: 'ease' }, default: 'ease-out' }),
])

describe('paramStore', () => {
  beforeEach(() => {
    paramStore.getState().clear()
  })

  it('starts empty — no lesson, no values', () => {
    expect(paramStore.getState().lessonId).toBeNull()
    expect(paramStore.getState().values).toEqual({})
  })

  it('seeds every value from the descriptor defaults', () => {
    paramStore.getState().loadLesson(tween)

    expect(paramStore.getState().lessonId).toBe('native-tween')
    expect(paramStore.getState().values).toEqual({
      duration: 2,
      ghosts: true,
      method: 'from',
    })
  })

  it('writes one value and leaves the others untouched', () => {
    paramStore.getState().loadLesson(tween)
    paramStore.getState().setValue('duration', 3.5)

    expect(paramStore.getState().values).toEqual({
      duration: 3.5,
      ghosts: true,
      method: 'from',
    })
  })

  it('drops the previous lesson entirely when another is loaded', () => {
    paramStore.getState().loadLesson(tween)
    paramStore.getState().setValue('duration', 3.5)
    paramStore.getState().loadLesson(easing)

    // Aucune valeur de la leçon précédente ne survit : une seule scène active à la fois.
    expect(paramStore.getState().values).toEqual({ curve: 'ease-out' })
    expect(paramStore.getState().values.duration).toBeUndefined()
  })

  it('restores the descriptor defaults on reset', () => {
    paramStore.getState().loadLesson(tween)
    paramStore.getState().setValue('duration', 3.5)
    paramStore.getState().setValue('ghosts', false)
    paramStore.getState().reset()

    expect(paramStore.getState().values).toEqual({ duration: 2, ghosts: true, method: 'from' })
  })

  it('ignores a write to a parameter the current lesson does not declare', () => {
    paramStore.getState().loadLesson(tween)
    paramStore.getState().setValue('unknown-param', 42)

    expect(paramStore.getState().values['unknown-param']).toBeUndefined()
    expect(paramStore.getState().values).toEqual({ duration: 2, ghosts: true, method: 'from' })
  })
})

describe('transient subscription', () => {
  beforeEach(() => {
    paramStore.getState().clear()
  })

  it('notifies a subscriber of one parameter with its new value', () => {
    paramStore.getState().loadLesson(tween)
    const listener = vi.fn()
    const unsubscribe = paramStore.subscribeToParam('duration', listener)

    paramStore.getState().setValue('duration', 3.5)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(3.5)
    unsubscribe()
  })

  it('stays silent when another parameter changes', () => {
    paramStore.getState().loadLesson(tween)
    const listener = vi.fn()
    const unsubscribe = paramStore.subscribeToParam('duration', listener)

    paramStore.getState().setValue('ghosts', false)

    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
  })

  it('stops notifying after unsubscribe — no live listener survives a lesson change', () => {
    paramStore.getState().loadLesson(tween)
    const listener = vi.fn()
    const unsubscribe = paramStore.subscribeToParam('duration', listener)
    unsubscribe()

    paramStore.getState().setValue('duration', 4)

    expect(listener).not.toHaveBeenCalled()
  })

  it('notifies every change during a drag, not only the last one', () => {
    paramStore.getState().loadLesson(tween)
    const listener = vi.fn()
    const unsubscribe = paramStore.subscribeToParam('duration', listener)

    for (const value of [2.1, 2.2, 2.3, 2.4]) {
      paramStore.getState().setValue('duration', value)
    }

    expect(listener).toHaveBeenCalledTimes(4)
    expect(listener).toHaveBeenLastCalledWith(2.4)
    unsubscribe()
  })
})

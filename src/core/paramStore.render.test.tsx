import { paramStore, useParamSubscription, useParamValue } from '@core/paramStore'
import type { Lesson } from '@core/types'
import { act, render } from '@testing-library/react'
import { useRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Piège React n°2 (spec §2) : un curseur déplacé produit ~60 changements de valeur par
// seconde. S'ils re-rendent l'arbre React, la démonstration saccade — sur un site qui
// enseigne la fluidité, c'est rédhibitoire.
//
// Ce fichier est la preuve exécutable de la TASK T3H-142 : « un déplacement de curseur ne
// doit provoquer aucun rendu au-delà du composant qui affiche la valeur ». Le profileur
// React n'étant pas automatisable, on compte les rendus.

const lesson: Lesson = {
  id: 'native-tween',
  slug: 'tween',
  family: 'native',
  order: 2,
  titleKey: 'lesson.native-tween.title',
  scene: 'webgl',
  transport: 'timeline',
  params: [
    {
      id: 'duration',
      label: 'duration',
      group: 'group.values',
      control: { type: 'slider', min: 0.1, max: 5, step: 0.1 },
      default: 2,
    },
  ],
  code: [],
  animate: () => ({ x: 0, showGhosts: false }),
  timing: () => ({ duration: 2, easing: 'linear' }),
}

const DRAG_STEPS = 60

/** Ce que fait le moteur d'animation : il suit la valeur sans jamais re-rendre. */
function AnimationEngine({ onValue, onRender }: EngineProps) {
  onRender()
  const seen = useRef<number>(0)
  useParamSubscription('duration', (value) => {
    seen.current += 1
    onValue(value)
  })
  return <div data-testid="engine" />
}

interface EngineProps {
  onValue: (value: number | string | boolean | undefined) => void
  onRender: () => void
}

/** Le seul composant qui a le droit de re-rendre : celui qui affiche la valeur. */
function ValueReadout({ onRender }: { onRender: () => void }) {
  onRender()
  const value = useParamValue('duration')
  return <output data-testid="readout">{String(value)}</output>
}

describe('a slider drag must not re-render beyond the value readout', () => {
  beforeEach(() => {
    paramStore.getState().clear()
    paramStore.getState().loadLesson(lesson)
  })

  it('leaves the animation engine at its initial render while the readout follows', () => {
    const engineRender = vi.fn()
    const readoutRender = vi.fn()
    const seenValue = vi.fn()

    render(
      <>
        <AnimationEngine onRender={engineRender} onValue={seenValue} />
        <ValueReadout onRender={readoutRender} />
      </>,
    )

    expect(engineRender).toHaveBeenCalledTimes(1)
    expect(readoutRender).toHaveBeenCalledTimes(1)

    // Chaque écriture dans son propre `act` : c'est un drag, pas un lot groupé.
    for (let step = 1; step <= DRAG_STEPS; step += 1) {
      act(() => {
        paramStore.getState().setValue('duration', step / 10)
      })
    }

    // La revendication centrale, assertée en premier : le moteur n'a pas re-rendu.
    expect(engineRender).toHaveBeenCalledTimes(1)

    // Seul l'affichage de la valeur a suivi.
    expect(readoutRender).toHaveBeenCalledTimes(1 + DRAG_STEPS)

    // Et le moteur a bien vu les 60 valeurs, sans en manquer ni en inventer.
    expect(seenValue).toHaveBeenCalledTimes(DRAG_STEPS)
    expect(seenValue).toHaveBeenLastCalledWith(DRAG_STEPS / 10)
  })

  it('shows the current value in the DOM after the drag', () => {
    const { getByTestId } = render(<ValueReadout onRender={() => {}} />)

    act(() => {
      paramStore.getState().setValue('duration', 4.2)
    })

    expect(getByTestId('readout').textContent).toBe('4.2')
  })

  it('releases its subscription on unmount — nothing survives leaving the lesson', () => {
    const seenValue = vi.fn()
    const { unmount } = render(<AnimationEngine onRender={() => {}} onValue={seenValue} />)

    unmount()
    act(() => {
      paramStore.getState().setValue('duration', 3)
    })

    expect(seenValue).not.toHaveBeenCalled()
  })

  it('survives a StrictMode double mount without subscribing twice', async () => {
    const { StrictMode } = await import('react')
    const seenValue = vi.fn()

    render(
      <StrictMode>
        <AnimationEngine onRender={() => {}} onValue={seenValue} />
      </StrictMode>,
    )

    act(() => {
      paramStore.getState().setValue('duration', 3)
    })

    // Un double abonnement ferait avancer l'animation deux fois par changement.
    expect(seenValue).toHaveBeenCalledTimes(1)
  })
})

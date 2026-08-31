import { FAMILY_SIZES, globalIndex } from '@core/lessonRegistry'
import { paramStore } from '@core/paramStore'
import type { CubeAnimation, Lesson } from '@core/types'
import { useTranslation } from '@i18n/localeStore'
import { projectWorldX } from '@scenes/projection'
import type { TimeDriver } from '@transport/TimeDriver'
import { useEffect, useRef } from 'react'

import './SceneOverlay.css'

// Les décors de la scène — direction « banc d'essai » du handoff (écran 2b).
//
// Le site doit ressembler à un instrument de mesure : graduations fines sur les bords,
// repères chiffrés, et des mesures affichées **en permanence**. Ce ne sont pas des
// ornements : sur une leçon qui enseigne le mouvement, pouvoir lire la position et le temps
// pendant que ça bouge fait partie du contenu.
//
// Comme la barre de transport, les mesures sont écrites directement dans le DOM depuis une
// boucle `requestAnimationFrame` : les faire passer par un état React les rendrait à
// soixante images par seconde.

const FAMILY_TAG: Record<Lesson['family'], string> = {
  native: 'NATIF',
  gsap: 'GSAP',
  shaders: 'SHADERS',
}

/**
 * Abscisses graduées, en unités de scène. Ce sont de **vraies** positions : chaque repère
 * est placé là où la caméra projette cette abscisse, et il porte donc la même valeur que
 * l'encart de mesures. Les repères précédents étaient posés à intervalle fixe et ne
 * correspondaient à rien.
 */
const MARKS = [-10, -5, 0, 5, 10]

export interface SceneOverlayProps {
  readonly lesson: Lesson
  readonly driver: TimeDriver
  readonly animate: CubeAnimation
}

export function SceneOverlay({ lesson, driver, animate }: SceneOverlayProps) {
  const t = useTranslation()
  const measures = useRef<HTMLOutputElement>(null)
  const axis = useRef<HTMLDivElement>(null)
  const frames = useRef({ count: 0, since: 0, fps: 60 })

  useEffect(() => {
    let handle = 0
    let previous = performance.now()

    const tick = (now: number) => {
      const delta = now - previous
      previous = now

      // Moyenne glissante sur une demi-seconde : un compteur qui saute à chaque image est
      // illisible, et c'est la stabilité du chiffre qui rend une chute perceptible.
      const state = frames.current
      state.count += 1
      state.since += delta
      if (state.since >= 500) {
        state.fps = Math.round((state.count * 1000) / state.since)
        state.count = 0
        state.since = 0
      }

      // Replacer les repères à chaque image serait absurde ; la caméra ne bouge qu'au
      // redimensionnement, et c'est bien meilleur marché de comparer une position que de
      // maintenir un second observateur.
      if (axis.current) {
        for (const mark of axis.current.children) {
          if (!(mark instanceof HTMLElement)) continue
          const value = Number(mark.dataset.mark)
          const fraction = projectWorldX(value)
          if (fraction === null) continue
          const next = `${(fraction * 100).toFixed(3)}%`
          if (mark.style.left !== next) mark.style.left = next
          mark.hidden = fraction < 0.02 || fraction > 0.98
        }
      }

      if (measures.current) {
        const { x } = animate(driver.easedProgress, paramStore.getState().values)
        const seconds = driver.timeProgress * driver.duration
        measures.current.textContent = `x ${x.toFixed(2)} · t ${seconds.toFixed(2)} s · ${state.fps} fps`
      }

      handle = requestAnimationFrame(tick)
    }

    handle = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(handle)
  }, [driver, animate])

  const tag = `${FAMILY_TAG[lesson.family]}.${String(lesson.order).padStart(2, '0')}`

  return (
    <div className="overlay" aria-hidden="true">
      <div className="overlay__head">
        <span className="overlay__crumb">
          {tag} · {t(lesson.titleKey).toUpperCase()}
        </span>
        {lesson.property ? <span className="overlay__property">{lesson.property}</span> : null}
      </div>

      {/* Graduation fine du bord gauche : texture, sans chiffres — elle ne mesure rien. */}
      <div className="overlay__ruler overlay__ruler--left" />

      {/* L'axe des abscisses, gradué là où la caméra projette réellement chaque valeur. */}
      <div className="overlay__axis" ref={axis}>
        {MARKS.map((mark) => (
          <span key={mark} className="overlay__mark" data-mark={mark}>
            <span className="overlay__tick" />
            {mark}
          </span>
        ))}
      </div>

      <output className="overlay__measures" data-testid="scene-measures" ref={measures} />

      <span className="visually-hidden">
        {globalIndex(lesson)} / {FAMILY_SIZES.native + FAMILY_SIZES.gsap + FAMILY_SIZES.shaders}
      </span>
    </div>
  )
}

import { CodePanel } from '@code/CodePanel'
import { ControlPanel } from '@controls/ControlPanel'
import { paramStore } from '@core/paramStore'
import type { Lesson } from '@core/types'
import { useTranslation } from '@i18n/localeStore'
import { SceneOverlay } from '@scenes/SceneOverlay'
import { sceneStore } from '@scenes/sceneStore'
import { useLessonDriver } from '@shell/useLessonDriver'
import { TransportBar } from '@transport/TransportBar'
import { useEffect, useMemo, useRef } from 'react'

import './LessonShell.css'

// Le gabarit commun : chrome + scène + contrôles + transport + code.
//
// **Il n'a aucune connaissance des leçons individuelles.** Pas un `if (lesson.id === …)`,
// pas un composant importé pour une leçon précise. Tout ce qu'il affiche vient du
// descripteur. Si accueillir une leçon demandait de modifier ce fichier, c'est le contrat
// qui serait mauvais — et c'est très exactement ce que jugera le lot 2.

export function LessonShell({ lesson }: { lesson: Lesson }) {
  const t = useTranslation()
  const driver = useLessonDriver(lesson)
  const sceneBox = useRef<HTMLDivElement>(null)

  // Chargement **pendant le rendu**, pas dans un effet. Un effet s'exécute après le
  // premier rendu des enfants, et le panneau de code afficherait alors une ligne calculée
  // sur un store vide — une ligne fausse, visible le temps d'une frame, sur le composant
  // dont toute la raison d'être est d'afficher le code exact.
  // L'appel est idempotent : au deuxième rendu (StrictMode compris) la leçon est déjà là.
  if (paramStore.getState().lessonId !== lesson.id) {
    paramStore.getState().loadLesson(lesson)
  }

  useEffect(() => {
    if (driver) sceneStore.getState().setScene(lesson.scene, lesson.id, driver, lesson.animate)
  }, [lesson, driver])

  // Quitter la leçon libère tout : une seule scène active à la fois (spec §5).
  useEffect(
    () => () => {
      sceneStore.getState().clearScene()
      paramStore.getState().clear()
    },
    [],
  )

  // Le canvas est monté au-dessus des routes ; il se superpose à ce rectangle. On le
  // publie à chaque changement de taille — un style à mettre à jour, jamais un remontage.
  useEffect(() => {
    const element = sceneBox.current
    if (!element) return

    const publish = () => {
      const rect = element.getBoundingClientRect()
      sceneStore.getState().setBox({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      })
    }

    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(element)
    window.addEventListener('scroll', publish, { passive: true })
    window.addEventListener('resize', publish)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', publish)
      window.removeEventListener('resize', publish)
    }
  }, [])

  const sceneDescriptionKey = useMemo(
    () => `${lesson.titleKey.replace(/\.title$/, '')}.scene` as typeof lesson.titleKey,
    [lesson.titleKey],
  )

  return (
    <main
      className="lesson"
      data-family={lesson.family}
      data-testid="lesson-screen"
      data-lesson-id={lesson.id}
    >
      <div className="lesson__stage">
        <div className="lesson__scene">
          {/* Le titre reste un `h1` pour la structure du document ; il est habillé en fil
              d'Ariane monospace, comme la maquette. */}
          <h1 className="visually-hidden">{t(lesson.titleKey)}</h1>

          {/* Description textuelle courte par scène, pour les lecteurs d'écran (spec §9). */}
          <p className="visually-hidden" data-testid="scene-description">
            {t(sceneDescriptionKey)}
          </p>

          {/* Le canvas persistant vient se superposer à ce rectangle. */}
          <div className="scene-view" ref={sceneBox} data-testid="scene-view" />

          {driver ? (
            <SceneOverlay lesson={lesson} driver={driver} animate={lesson.animate} />
          ) : null}
        </div>

        {lesson.transport === 'timeline' && driver ? <TransportBar driver={driver} /> : null}
      </div>

      <aside className="lesson__rail">
        <ControlPanel params={lesson.params} />
        <div className="lesson__code">
          <CodePanel templates={lesson.code} />
        </div>
      </aside>
    </main>
  )
}

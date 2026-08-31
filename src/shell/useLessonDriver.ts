import { findEasing } from '@core/easings'
import { paramStore } from '@core/paramStore'
import { motionStore, prefersReducedMotion } from '@core/reducedMotion'
import type { Lesson, ParamValues } from '@core/types'
import { createWaapiDriver, isWaapiAvailable } from '@transport/drivers/waapi'
import type { TimeDriver } from '@transport/TimeDriver'
import { useEffect, useState } from 'react'

// Fabrique le driver de la leçon et le tient à jour.
//
// Deux comportements que la spec exige explicitement :
//
//   - **Régler un paramètre pendant la lecture ne casse pas la lecture** (point 5 du
//     « terminé ») : on ne recrée pas le driver, on le re-cadence. `retime` conserve la
//     progression normalisée, donc la démo reprend là où elle en était.
//   - **Mouvement réduit** : pas de lecture automatique, scrub seul (spec §4.8). La démo
//     ne disparaît pas, elle devient manuelle.

const DURATION_PARAM = 'duration'
const EASING_PARAM = 'easing'

const readDuration = (values: ParamValues, fallback: number): number => {
  const value = values[DURATION_PARAM]
  return typeof value === 'number' ? value : fallback
}

const readEasing = (values: ParamValues): string => {
  const value = values[EASING_PARAM]
  const easing = typeof value === 'string' ? findEasing(value) : undefined
  return easing?.css ?? 'linear'
}

export const useLessonDriver = (lesson: Lesson): TimeDriver | null => {
  const [driver, setDriver] = useState<TimeDriver | null>(null)

  useEffect(() => {
    if (lesson.transport === 'none' || !isWaapiAvailable()) return

    const seed = Object.fromEntries(lesson.params.map((param) => [param.id, param.default]))
    const created = createWaapiDriver({
      duration: readDuration(seed, 2),
      easing: readEasing(seed),
      // En boucle par défaut : une démonstration qu'il faut relancer à la main pour
      // observer un réglage n'est pas une démonstration. C'est aussi ce qui rend visible
      // l'effet du mode mouvement réduit, qui coupe la lecture automatique.
      loop: true,
    })
    setDriver(created)

    // Pas de lecture automatique en mouvement réduit : la démo reste manipulable au scrub.
    if (!prefersReducedMotion()) created.play()

    // Et il faut **réagir au changement**, pas seulement lire la préférence à la création :
    // basculer l'interrupteur du chrome pendant la leçon ne faisait rien du tout.
    const unwatchMotion = motionStore.subscribe((state) => {
      const reduced =
        state.preference === 'forced-on' || (state.preference === 'system' && state.systemReduces)
      if (reduced) created.pause()
      else created.play()
    })

    // Abonnement transitoire : re-cadencer ne doit provoquer aucun rendu React.
    const unsubscribe = paramStore.subscribe(
      (state) => state.values,
      (values) => {
        created.retime(lesson.timing(values))
      },
    )

    return () => {
      unsubscribe()
      unwatchMotion()
      created.dispose()
      setDriver(null)
    }
  }, [lesson])

  return driver
}

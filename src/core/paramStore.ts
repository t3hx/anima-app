import type { Lesson, ParamValue, ParamValues } from '@core/types'
import { useEffect, useRef } from 'react'
import { useStore } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

// L'unique source de vérité des valeurs de paramètres (invariant : ne jamais les stocker
// ailleurs). Un seul store pour la leçon en cours — une seule scène est active à la fois.
//
// Il sert trois consommateurs à trois régimes différents, et c'est tout l'enjeu :
//   - les contrôles lisent avec re-rendu, via `useStore` ;
//   - le moteur d'animation s'abonne en transitoire (`subscribeToParam`), sans re-rendu :
//     un curseur produit 60 changements par seconde, les faire traverser React ferait
//     saccader la démonstration ;
//   - le panneau de code est regénéré en différé.

export interface ParamState {
  /** La leçon dont les valeurs sont chargées, ou `null` si aucune. */
  readonly lessonId: string | null
  readonly values: ParamValues
  /** Les valeurs par défaut du descripteur, gardées pour `reset`. */
  readonly defaults: ParamValues
  /**
   * Le dernier paramètre touché. C'est lui que le panneau de code surligne : « la ligne
   * correspondant au contrôle en cours de manipulation est surlignée » (handoff).
   * Sans cette trace, le panneau ne saurait pas quelle ligne mettre en évidence.
   */
  readonly touchedId: string | null
  /** Charge une leçon : les valeurs de la précédente sont abandonnées. */
  loadLesson: (lesson: Lesson) => void
  setValue: (id: string, value: ParamValue) => void
  /** Revient aux valeurs par défaut du descripteur, sans changer de leçon. */
  reset: () => void
  /** Vide le store — appelé en quittant une leçon. */
  clear: () => void
  /** Éteint la surbrillance, au relâchement du contrôle. */
  clearTouched: () => void
}

const seedFromDefaults = (lesson: Lesson): ParamValues =>
  Object.fromEntries(lesson.params.map((param) => [param.id, param.default]))

const EMPTY: ParamValues = {}

const store = createStore<ParamState>()(
  subscribeWithSelector((set, get) => ({
    lessonId: null,
    values: EMPTY,
    defaults: EMPTY,
    touchedId: null,

    loadLesson: (lesson) => {
      const defaults = seedFromDefaults(lesson)
      set({ lessonId: lesson.id, values: defaults, defaults, touchedId: null })
    },

    setValue: (id, value) => {
      // Un paramètre que la leçon ne déclare pas n'a pas de place ici : l'accepter
      // laisserait le code affiché et la scène diverger silencieusement du descripteur.
      if (!(id in get().values)) return
      set({ values: { ...get().values, [id]: value }, touchedId: id })
    },

    reset: () => set({ values: get().defaults }),

    clear: () => set({ lessonId: null, values: EMPTY, defaults: EMPTY, touchedId: null }),

    clearTouched: () => set({ touchedId: null }),
  })),
)

/**
 * Abonnement transitoire à un seul paramètre. Le listener reçoit la valeur, rien d'autre,
 * et n'entraîne aucun rendu React — c'est ce qui permet au moteur d'animation de suivre un
 * curseur à 60 changements par seconde.
 */
const subscribeToParam = (
  id: string,
  listener: (value: ParamValue | undefined) => void,
): (() => void) =>
  store.subscribe(
    (state) => state.values[id],
    (value) => listener(value),
  )

export const paramStore = Object.assign(store, { subscribeToParam })

/**
 * Lecture re-rendante d'un paramètre. Réservée aux composants dont l'affichage *est* la
 * valeur — l'affichage chiffré à côté d'un curseur. Tout autre usage réintroduit le
 * re-rendu à 60 Hz que `subscribeToParam` existe pour éviter.
 */
export const useParamValue = (id: string): ParamValue | undefined =>
  useStore(store, (state) => state.values[id])

/**
 * Abonnement transitoire depuis un composant : le listener est appelé à chaque changement
 * du paramètre, **sans provoquer de rendu**. C'est ce qu'utilise le moteur d'animation.
 *
 * Le listener est gardé dans une référence pour que sa recréation à chaque rendu ne
 * relance pas l'abonnement ; seul un changement d'`id` le fait. Le désabonnement au
 * démontage est ce qui garantit qu'aucun abonné ne survit à la sortie d'une leçon —
 * y compris au double montage de `StrictMode`.
 */
export const useParamSubscription = (
  id: string,
  listener: (value: ParamValue | undefined) => void,
): void => {
  const latest = useRef(listener)
  useEffect(() => {
    latest.current = listener
  })
  useEffect(() => subscribeToParam(id, (value) => latest.current(value)), [id])
}

export const useParamValues = (): ParamValues => useStore(store, (state) => state.values)

export const useTouchedParam = (): string | null => useStore(store, (state) => state.touchedId)

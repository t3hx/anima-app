import type { CubeAnimation, SceneKind } from '@core/types'
import type { TimeDriver } from '@transport/TimeDriver'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

// Ce que le canvas doit dessiner, et où.
//
// Le canvas est **unique et persistant**, monté au-dessus des routes : ce qui change d'une
// leçon à l'autre, c'est ce store — jamais le `<Canvas>` lui-même.
//
// `box` est le rectangle que la scène occupe à l'écran, publié par le shell. Le canvas s'y
// superpose. Une première version passait par le `<View>` de drei, qui découpe le canvas en
// régions : mesuré, il rapportait une hauteur de zéro pour une boîte de 892 × 562, donc un
// ciseau de découpe plat — les triangles étaient dessinés dans une bande invisible.
// Positionner le canvas nous-mêmes est moins astucieux et se vérifie.

export interface SceneBox {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

interface SceneState {
  readonly kind: SceneKind | null
  readonly lessonId: string | null
  readonly driver: TimeDriver | null
  readonly animate: CubeAnimation | null
  readonly box: SceneBox | null
  setScene: (kind: SceneKind, lessonId: string, driver: TimeDriver, animate: CubeAnimation) => void
  setBox: (box: SceneBox | null) => void
  clearScene: () => void
}

export const sceneStore = createStore<SceneState>()((set) => ({
  kind: null,
  lessonId: null,
  driver: null,
  animate: null,
  box: null,
  setScene: (kind, lessonId, driver, animate) => set({ kind, lessonId, driver, animate }),
  setBox: (box) => set({ box }),
  clearScene: () => set({ kind: null, lessonId: null, driver: null, animate: null, box: null }),
}))

// Un sélecteur par champ, jamais un objet fabriqué à la volée. Zustand 5 s'appuie sur
// `useSyncExternalStore`, qui compare les instantanés par référence : un sélecteur qui
// construit un objet en rend un neuf à chaque rendu, et la boucle est infinie. Le symptôme
// est « Maximum update depth exceeded », loin de la cause.

export const useSceneKind = (): SceneKind | null => useStore(sceneStore, (state) => state.kind)

export const useSceneLessonId = (): string | null => useStore(sceneStore, (state) => state.lessonId)

export const useSceneDriver = (): TimeDriver | null => useStore(sceneStore, (state) => state.driver)

export const useSceneAnimation = (): CubeAnimation | null =>
  useStore(sceneStore, (state) => state.animate)

export const useSceneBox = (): SceneBox | null => useStore(sceneStore, (state) => state.box)

/** Les scènes rendues **dans** le canvas WebGL. Les autres sont du DOM (lots 3 et 4). */
export const isWebglScene = (kind: SceneKind | null): boolean => kind === 'webgl'

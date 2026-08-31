import { liveDriverCount } from '@transport/drivers/waapi'

// Point d'observation des ressources vivantes, exposé sur `window`.
//
// Il existe parce que le point 7 du « terminé » — « quitter la leçon ne laisse ni timeline
// vivante ni ressource WebGL non libérée » — **n'est pas observable de l'extérieur
// autrement**. `document.getAnimations()` est aveugle à nos horloges (cible nulle, mesuré),
// et rien dans le DOM ne dit combien de géométries three.js retient.
//
// Sur un site de 25 scènes, une fuite est le risque numéro un. Le coût ici est de quelques
// centaines d'octets, et un développeur peut vérifier lui-même, dans sa console, qu'une
// navigation ne laisse rien derrière — ce qui, sur un site consacré au coût de l'animation,
// est plutôt à sa place.

interface RendererInfo {
  readonly memory: { readonly geometries: number; readonly textures: number }
  readonly programs?: { readonly length: number } | null
  readonly render: { readonly frame: number; readonly calls: number; readonly triangles: number }
}

interface Renderer {
  readonly info: RendererInfo
}

let renderer: Renderer | null = null

/**
 * Position du sujet de la scène en coordonnées normalisées d'écran : `-1..1` sur x et y,
 * `-1..1` sur z quand il est entre les plans de la caméra.
 *
 * Ce point d'observation existe à cause d'un défaut réel : la suite était entièrement verte
 * — 178 tests unitaires, 23 scénarios, le canvas monté, sept géométries, trois programmes
 * compilés, le transport qui avançait — et **l'écran était vide**. Tout était vérifié sauf
 * la seule chose qui compte : que le sujet soit dans le champ de la caméra.
 */
let projectSubject: (() => { x: number; y: number; z: number } | null) | null = null

export const registerSubject = (
  project: () => { x: number; y: number; z: number } | null,
): void => {
  projectSubject = project
}

export const unregisterSubject = (): void => {
  projectSubject = null
}

export const registerRenderer = (next: Renderer): void => {
  renderer = next
}

export const unregisterRenderer = (): void => {
  renderer = null
}

export interface RenderStats {
  readonly geometries: number
  readonly textures: number
  readonly programs: number
  /** Images effectivement rendues. Reste à 0 si la boucle ne démarre jamais. */
  readonly frames: number
  /** Appels de dessin de la dernière image. 0 = rien n'a été peint. */
  readonly calls: number
  readonly triangles: number
}

export interface Diagnostics {
  /** Horloges WAAPI non libérées. Doit valoir 0 hors d'une leçon. */
  liveDrivers: () => number
  /** Ressources WebGL retenues et compteurs de rendu, ou `null` si aucun canvas monté. */
  webgl: () => RenderStats | null
  /**
   * Le sujet de la scène en coordonnées normalisées d'écran. `null` si aucune scène.
   * Hors de `[-1, 1]` sur x ou y : l'objet est rendu, mais **pas à l'écran**.
   */
  subject: () => { x: number; y: number; z: number } | null
}

declare global {
  interface Window {
    __anima?: Diagnostics
  }
}

export const installDiagnostics = (): void => {
  window.__anima = {
    liveDrivers: () => liveDriverCount(),
    webgl: () =>
      renderer
        ? {
            geometries: renderer.info.memory.geometries,
            textures: renderer.info.memory.textures,
            programs: renderer.info.programs?.length ?? 0,
            frames: renderer.info.render.frame,
            calls: renderer.info.render.calls,
            triangles: renderer.info.render.triangles,
          }
        : null,
    subject: () => projectSubject?.() ?? null,
  }
}

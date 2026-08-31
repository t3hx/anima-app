// Les diagnostics exposés par l'application (`src/core/diagnostics.ts`), vus depuis les
// scénarios Playwright.
export {}

declare global {
  interface Window {
    __anima?: {
      liveDrivers: () => number
      webgl: () => {
        geometries: number
        textures: number
        programs: number
        frames: number
        calls: number
        triangles: number
      } | null
      subject: () => { x: number; y: number; z: number } | null
    }
  }
}

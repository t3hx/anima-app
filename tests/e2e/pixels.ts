import { PNG } from 'pngjs'

// Lecture de pixels sur une capture d'écran.
//
// Toutes les autres vérifications de la scène passent par des nombres que l'application
// rapporte elle-même : compteurs de rendu, position projetée. Elles sont utiles et elles
// **ne suffisent pas** — la leçon a été livrée une fois avec ces nombres justes et un écran
// vide, parce que le canvas était peint sous un aplat opaque.
//
// Ici on ne demande rien à l'application : on regarde ce que le navigateur a affiché.

export interface Pixel {
  readonly r: number
  readonly g: number
  readonly b: number
}

export const decode = (
  buffer: Buffer,
): { width: number; height: number; at: (x: number, y: number) => Pixel } => {
  const png = PNG.sync.read(buffer)
  return {
    width: png.width,
    height: png.height,
    at: (x, y) => {
      const index = (png.width * y + x) << 2
      return { r: png.data[index] ?? 0, g: png.data[index + 1] ?? 0, b: png.data[index + 2] ?? 0 }
    },
  }
}

export interface SceneSample {
  /** Pixels « braise vif » — la teinte du cube et de sa trace. */
  readonly accent: number
  /** Pixels de teinte braise mais sombres — les lignes du sol quadrillé. */
  readonly grid: number
  readonly total: number
  /** Nombre de lignes d'échantillonnage où le sol est visible. */
  readonly gridRows: number
  readonly rows: number
}

/**
 * Classe les pixels de la scène en trois familles : le sujet (braise vif), le sol (braise
 * sombre) et le fond.
 *
 * Deux mesures, et il en faut deux. Compter le sujet dit qu'**il y a quelque chose** ;
 * mesurer l'étalement du sol dit que **c'est cadré**. Vérifié par mutation : retirer la
 * caméra isométrique laisse le compte du sujet parfaitement satisfaisant — le cube passe
 * simplement collé à l'objectif — et seul l'étalement du sol s'effondre.
 */
export const sampleScene = (buffer: Buffer): SceneSample => {
  const image = decode(buffer)
  let accent = 0
  let grid = 0
  let gridRows = 0
  let rows = 0

  for (let y = 0; y < image.height; y += 2) {
    rows += 1
    let rowGrid = 0

    for (let x = 0; x < image.width; x += 2) {
      const { r, g, b } = image.at(x, y)
      const warm = r - b
      if (r > 110 && warm > 55 && r > g && g >= b) accent += 1
      else if (r > 45 && r <= 110 && warm > 12 && r > g) rowGrid += 1
    }

    grid += rowGrid
    if (rowGrid > 0) gridRows += 1
  }

  return { accent, grid, gridRows, rows, total: rows * Math.ceil(image.width / 2) }
}

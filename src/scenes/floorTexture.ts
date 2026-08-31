import { CanvasTexture, LinearFilter, type Texture } from 'three'

// Le sol de la scène, dessiné dans un canvas 2D puis plaqué sur un plan.
//
// Pourquoi une texture plutôt qu'un `gridHelper` : la maquette ne montre pas une grille
// uniforme, elle montre une grille **fondue vers l'horizon** — le handoff la construit
// exactement ainsi, avec deux `repeating-linear-gradient` et un `mask-image` qui l'efface
// vers le fond. Une texture reproduit cela à l'identique et coûte un seul appel de dessin.
//
// L'alternative — le brouillard de three.js — mélange vers une couleur opaque. Sur un
// canvas transparent posé sur le dégradé CSS de la scène, cela peindrait un voile visible
// au lieu de faire disparaître les lignes.

export interface FloorTextureOptions {
  /** Teinte des lignes, en `r, g, b`. Celle de la famille active. */
  readonly rgb: readonly [number, number, number]
  /** Nombre de cellules dessinées, dans chaque direction. */
  readonly cells?: number
  readonly size?: number
}

export const createFloorTexture = ({
  rgb,
  cells = 48,
  size = 2048,
}: FloorTextureOptions): Texture => {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  // jsdom ne fournit pas de contexte 2D. Une texture vide y suffit : ce que dessine le sol
  // se vérifie dans un navigateur, par lecture de pixels.
  const context = canvas.getContext('2d')
  if (!context) return new CanvasTexture(canvas)

  const [r, g, b] = rgb
  const step = size / cells
  context.lineWidth = 2

  // Deux familles de lignes, aux opacités du handoff : 16 % dans un sens, 12 % dans l'autre.
  for (let index = 0; index <= cells; index += 1) {
    const position = Math.round(index * step) + 0.5

    context.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.16)`
    context.beginPath()
    context.moveTo(position, 0)
    context.lineTo(position, size)
    context.stroke()

    context.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.12)`
    context.beginPath()
    context.moveTo(0, position)
    context.lineTo(size, position)
    context.stroke()
  }

  // Le fondu vers l'horizon. `destination-out` efface, donc le dégradé se lit comme le
  // `mask-image` de la maquette : transparent au loin, plein au premier plan.
  const fade = context.createLinearGradient(0, 0, 0, size)
  //
  // Les positions ne sont pas décoratives : elles sont calées sur la géométrie. Le plan
  // fait 64 unités, centré à z = -14, donc la fraction `f` du canvas correspond à
  // `z = -46 + 64 f`. Pour que le sol s'éteigne au milieu du cadre — l'horizon de la
  // maquette — l'effacement doit être total jusqu'à z ≈ -8, et nul vers z ≈ +8.
  fade.addColorStop(0, 'rgba(0, 0, 0, 1)')
  fade.addColorStop(0.6, 'rgba(0, 0, 0, 1)')
  fade.addColorStop(0.75, 'rgba(0, 0, 0, 0.45)')
  fade.addColorStop(0.88, 'rgba(0, 0, 0, 0)')
  fade.addColorStop(1, 'rgba(0, 0, 0, 0)')
  context.globalCompositeOperation = 'destination-out'
  context.fillStyle = fade
  context.fillRect(0, 0, size, size)

  const texture = new CanvasTexture(canvas)
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  return texture
}

/**
 * Tache d'ombre douce sous le sujet — la maquette en pose une, en dégradé radial. Elle
 * ancre le cube au sol : sans elle, il flotte, et la lecture de sa position est plus dure.
 */
export const createShadowTexture = (size = 256): Texture => {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')
  if (!context) return new CanvasTexture(canvas)

  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)')
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.12)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)

  const texture = new CanvasTexture(canvas)
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  return texture
}

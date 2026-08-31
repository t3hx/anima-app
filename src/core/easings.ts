// Catalogue des courbes proposées par le contrôle `ease`. La liste est commune à toutes les
// leçons — un descripteur déclare `{ type: 'ease' }` et rien de plus (spec §3).
//
// Ce module **ne pilote aucune animation** : c'est le navigateur qui applique la courbe,
// via la chaîne `css` passée au `KeyframeEffect`. Il ne sert qu'à tracer les vignettes, et
// il les trace depuis les points de contrôle réels plutôt que depuis un chemin SVG écrit à
// la main — un chemin en dur finit toujours par mentir sur la courbe appliquée.
//
// Les mots-clés CSS ont des équivalents en courbe de Bézier définis par la spécification,
// ce qui permet un traceur unique.

export interface Easing {
  readonly id: string
  /** Ce qui part réellement au navigateur. */
  readonly css: string
  /** Points de contrôle `x1, y1, x2, y2`, pour le tracé. */
  readonly points: readonly [number, number, number, number]
}

export const EASINGS: readonly Easing[] = [
  { id: 'linear', css: 'linear', points: [0, 0, 1, 1] },
  { id: 'ease', css: 'ease', points: [0.25, 0.1, 0.25, 1] },
  { id: 'ease-in', css: 'ease-in', points: [0.42, 0, 1, 1] },
  { id: 'ease-out', css: 'ease-out', points: [0, 0, 0.58, 1] },
  { id: 'ease-in-out', css: 'ease-in-out', points: [0.42, 0, 0.58, 1] },
  // Forme compacte : sous sa forme longue, la ligne `easing:` du panneau dépassait la
  // largeur du rail. La syntaxe CSS accepte les décimales sans zéro de tête.
  { id: 'back-out', css: 'cubic-bezier(.34,1.56,.64,1)', points: [0.34, 1.56, 0.64, 1] },
]

export const findEasing = (id: string): Easing | undefined =>
  EASINGS.find((easing) => easing.id === id)

/** Courbe de Bézier cubique à extrémités fixées en 0 et 1, sur un seul axe. */
const bezier = (a: number, b: number, t: number): number => {
  const u = 1 - t
  return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t
}

/**
 * Inverse `x(t)` par bissection. La forme close n'existe pas, et Newton diverge sur les
 * courbes à dépassement (`back-out`), où la dérivée s'annule.
 */
const solveT = (x1: number, x2: number, x: number): number => {
  let low = 0
  let high = 1
  for (let i = 0; i < 40; i += 1) {
    const mid = (low + high) / 2
    if (bezier(x1, x2, mid) < x) low = mid
    else high = mid
  }
  return (low + high) / 2
}

/** `count` valeurs de la courbe, régulièrement espacées dans le **temps**. */
export const sampleEasing = (
  easing: Pick<Easing, 'points'> & { readonly id: string; readonly css: string },
  count: number,
): readonly number[] => {
  const [x1, y1, x2, y2] = easing.points
  return Array.from({ length: count }, (_, index) => {
    const x = index / (count - 1)
    if (x <= 0) return 0
    if (x >= 1) return 1
    return bezier(y1, y2, solveT(x1, x2, x))
  })
}

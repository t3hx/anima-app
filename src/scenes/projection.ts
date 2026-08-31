// Projection de l'axe du monde vers l'écran.
//
// Elle existe pour une raison précise : les graduations de la scène ne mesuraient **rien**.
// Elles étaient posées à intervalle fixe, numérotées 0, 5, 10, collées à gauche, pendant
// que le cube parcourait x de 10 à 0 dans l'autre sens. Un « banc d'essai » dont les
// repères ne correspondent à aucune grandeur est un décor, et un décor qui prétend mesurer
// est pire qu'un décor.
//
// La scène publie ici la seule fonction qui sache où tombe une abscisse : elle connaît la
// caméra. L'habillage la consomme sans rien savoir de three.js.

/** Rend la position horizontale à l'écran, en fraction `0..1` de la scène, ou `null`. */
export type Projector = (worldX: number) => number | null

let projector: Projector | null = null

export const setProjector = (next: Projector | null): void => {
  projector = next
}

export const projectWorldX = (worldX: number): number | null => projector?.(worldX) ?? null

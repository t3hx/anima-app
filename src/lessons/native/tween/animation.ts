import type { CubeAnimation } from '@core/types'

// Le seul code spécifique à `native-tween`. Fonction **pure** : une progression et des
// valeurs entrent, une position sort. Elle ne connaît ni three.js, ni le DOM, ni le store.
//
// Position de repos : `x = 0`. C'est la valeur que la WAAPI lit sur l'objet quand une
// keyframe est **implicite** — l'accolade vide du code. Chaque méthode décide laquelle des
// deux extrémités est écrite et laquelle est déduite :
//
//   to      repos → `to`      l'arrivée est déclarée, le départ est lu
//   from    `from` → repos    le départ est déclaré, l'arrivée est lue
//   fromTo  `from` → `to`     les deux sont déclarées, rien n'est déduit
//   set     `from`, puis saut à `to`  aucune interpolation
//
// `set` n'est pas un cas dégénéré : c'est le contre-exemple. Il occupe la même durée que
// les autres et saute à la fin, ce qui rend l'absence de trajet **visible**. En WAAPI cela
// s'écrit `easing: 'steps(1, end)'` — le pas est la façon native de dire « pas
// d'interpolation », et c'est ce que le panneau de code affiche.

/** Position de repos du cube — ce que la WAAPI lit pour une keyframe implicite. */
const REST = 0

/** Extrémités du trajet pour chaque méthode. */
const travel = (method: string, from: number, to: number): readonly [number, number] => {
  switch (method) {
    case 'to':
      return [REST, to]
    case 'fromTo':
      return [from, to]
    case 'set':
      return [from, to]
    default:
      return [from, REST]
  }
}

export const animate: CubeAnimation = (progress, values) => {
  const from = Number(values.from ?? 10)
  const to = Number(values.to ?? 0)
  const method = String(values.method ?? 'from')
  const showGhosts = values.ghosts === true

  const [start, end] = travel(method, from, to)

  // `set` a deux keyframes au même offset 0,5 : la valeur tient la première moitié, saute,
  // puis tient la seconde. Le saut se **voit** — une durée nulle, ou un pas en toute fin de
  // course, ne se verraient pas, et c'est pourtant le saut qui est le contenu.
  const eased = method === 'set' ? (progress < 0.5 ? 0 : 1) : progress

  return { x: start + (end - start) * eased, showGhosts }
}

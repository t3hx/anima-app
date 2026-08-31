// Signal transverse : « le temps a bougé, redessine ».
//
// `frameloop="demand"` ne redessine que sur demande, ce qui est ce qu'on veut (une scène
// à l'arrêt ne doit pas consommer d'image). Mais tant que rien ne déclenche la demande, la
// scène reste figée pendant que la barre de transport, elle, avance — le pire des
// symptômes, parce que l'interface a l'air de fonctionner.
//
// Ce module est le seul point de couplage entre ce qui fait avancer le temps (le
// transport, le store de paramètres) et ce qui dessine (le canvas). Six lignes plutôt
// qu'une dépendance du transport vers les scènes.

let request: (() => void) | null = null

export const setRedrawRequester = (next: (() => void) | null): void => {
  request = next
}

export const requestRedraw = (): void => {
  request?.()
}

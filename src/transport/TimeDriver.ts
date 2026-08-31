// Le transport doit piloter indifféremment une timeline GSAP, une `Animation` WAAPI, une
// animation CSS et une boucle de rendu WebGL (spec §4.3). Une interface, quatre
// implémentations — pas des conditions dispersées dans le composant.
//
// Le lot 1 en livre une seule, WAAPI (`drivers/waapi.ts`).
//
// Deux progressions, et la distinction compte :
//   - `timeProgress` — la position **dans le temps**, linéaire. C'est ce que pilote le
//     scrub et ce qu'affiche la barre de transport.
//   - `easedProgress` — la progression **après application de la courbe**. C'est ce que la
//     scène applique à la propriété animée.
// Les confondre ferait sauter la poignée de scrub en même temps que le cube décélère.

export interface TimeDriverOptions {
  /** Durée en secondes — l'unité des descripteurs de leçon. */
  readonly duration: number
  /** Courbe, en syntaxe CSS : `linear`, `ease-out`, `cubic-bezier(...)`, `steps(...)`. */
  readonly easing: string
  readonly loop: boolean
}

export interface TimeDriver {
  readonly duration: number
  readonly playing: boolean
  readonly rate: number
  readonly looping: boolean
  readonly timeProgress: number
  readonly easedProgress: number
  play(): void
  pause(): void
  /** Positionne le temps. `progress` est linéaire, jamais eased. */
  seek(progress: number): void
  /** Vitesse de lecture, `0.25` à `4`, valeurs négatives incluses (spec §4.3). */
  setRate(rate: number): void
  setLoop(loop: boolean): void
  /**
   * Change la durée et/ou la courbe **en conservant la progression temporelle**.
   * C'est le mécanisme du point 5 du « terminé » : régler un paramètre pendant la lecture
   * reconstruit l'animation et reprend là où elle en était.
   */
  retime(options: Partial<Pick<TimeDriverOptions, 'duration' | 'easing'>>): void
  dispose(): void
}

/** Ramène une progression dans `[0, 1]`. Un non-fini devient le début, jamais NaN. */
export const clampProgress = (progress: number): number => {
  if (Number.isNaN(progress)) return 0
  return Math.min(1, Math.max(0, progress))
}

/** Progression normalisée → millisecondes, l'unité de la WAAPI. */
export const progressToTime = (progress: number, durationSeconds: number): number =>
  clampProgress(progress) * durationSeconds * 1000

/** Millisecondes → progression normalisée. Une durée nulle rend 0, pas NaN. */
export const timeToProgress = (timeMs: number, durationSeconds: number): number => {
  if (durationSeconds <= 0) return 0
  return clampProgress(timeMs / (durationSeconds * 1000))
}

import {
  clampProgress,
  progressToTime,
  type TimeDriver,
  type TimeDriverOptions,
  timeToProgress,
} from '@transport/TimeDriver'

// Driver WAAPI. Le point non évident : l'`Animation` n'anime **rien**.
//
// Son `KeyframeEffect` a une cible nulle — c'est légal, et c'est ce qui en fait une horloge
// pure. La scène du lot 1 est un `mesh` three.js, que la WAAPI ne saurait pas animer ; ce
// que le navigateur fournit ici, c'est le temps, la courbe et les contrôles de lecture,
// et la scène lit la progression à chaque frame de rendu.
//
// Mesuré dans Chromium avant d'écrire ce fichier : à 25 % du temps avec
// `cubic-bezier(.25,1,.5,1)`, `getComputedTiming().progress` rend 0.6885899020168309, soit
// exactement l'opacité calculée d'un vrai élément animé avec la même courbe. L'easing est
// donc appliqué par le moteur du navigateur — nous n'en calculons aucun, ce qu'interdit
// l'invariant « ne jamais écrire un moteur d'animation maison par-dessus la WAAPI ».

/**
 * Les drivers vivants. `document.getAnimations()` **ne les voit pas** : il ne rend que les
 * animations associées aux éléments du document, et les nôtres ont une cible nulle.
 * Mesuré : pendant qu'un driver joue, `document.getAnimations().length` vaut 0.
 *
 * C'est pourquoi ce registre existe. Sans lui, le point 7 du « terminé » (« quitter la
 * leçon ne laisse ni timeline vivante ni ressource non libérée ») serait vérifié par une
 * assertion aveugle — verte quoi qu'il arrive, y compris en cas de fuite.
 */
const liveDrivers = new Set<TimeDriver>()

export const liveDriverCount = (): number => liveDrivers.size

/** L'API est indisponible hors navigateur — jsdom n'en implémente rien. */
export const isWaapiAvailable = (): boolean =>
  typeof KeyframeEffect === 'function' && typeof Animation === 'function'

export const createWaapiDriver = (options: TimeDriverOptions): TimeDriver => {
  if (!isWaapiAvailable()) {
    throw new Error('The Web Animations API is unavailable in this environment')
  }

  let duration = options.duration
  let easing = options.easing
  let looping = options.loop

  // Deux keyframes sans propriété : rien à peindre, seulement un temps à parcourir.
  const effect = new KeyframeEffect(null, [{ offset: 0 }, { offset: 1 }], {
    duration: duration * 1000,
    easing,
    iterations: looping ? Number.POSITIVE_INFINITY : 1,
    fill: 'both',
  })

  const animation = new Animation(effect, document.timeline)

  const currentTimeMs = (): number => {
    const time = animation.currentTime
    return typeof time === 'number' ? time : 0
  }

  const driver: TimeDriver = {
    get duration() {
      return duration
    },

    get playing() {
      return animation.playState === 'running'
    },

    get rate() {
      return animation.playbackRate
    },

    get looping() {
      return looping
    },

    get timeProgress() {
      const total = duration * 1000
      const raw = currentTimeMs()
      if (!looping || total <= 0) return timeToProgress(raw, duration)

      // En boucle, `currentTime` dépasse la durée : on veut la position dans l'itération.
      // Le cas limite compte : à la fin exacte d'un tour, le modulo rend 0, si bien qu'un
      // scrub à 100 % renvoyait la poignée — et la scène — au début. On garde la fin
      // comme une fin.
      const elapsed = raw % total
      return timeToProgress(elapsed === 0 && raw > 0 ? total : elapsed, duration)
    },

    get easedProgress() {
      // `progress` est la progression **transformée** : la courbe est déjà appliquée.
      const progress = effect.getComputedTiming().progress ?? 0
      // Même cas limite qu'au-dessus : à la fin exacte d'un tour, le moteur rend 0 parce
      // qu'il décrit le début de l'itération suivante. La scène doit voir une fin.
      if (looping && progress === 0 && this.timeProgress >= 1) return 1
      return clampProgress(progress)
    },

    play() {
      // Rejouer depuis la fin repart du début, sinon le bouton lecture ne fait rien.
      if (!looping && this.timeProgress >= 1) animation.currentTime = 0
      animation.play()
    },

    pause() {
      // `pause()` est différé : l'animation reste « pause-pending » jusqu'à la prochaine
      // mise à jour de la timeline, et `currentTime` continue d'avancer d'ici là. Réécrire
      // `currentTime` fige l'instant tout de suite — sans quoi la poignée de scrub dérive
      // d'une frame à chaque pause.
      const held = currentTimeMs()
      animation.pause()
      animation.currentTime = held
    },

    seek(progress) {
      animation.currentTime = progressToTime(progress, duration)
    },

    setRate(rate) {
      animation.playbackRate = rate
    },

    setLoop(loop) {
      const progress = this.timeProgress
      looping = loop
      effect.updateTiming({ iterations: loop ? Number.POSITIVE_INFINITY : 1 })
      animation.currentTime = progressToTime(progress, duration)
    },

    retime(next) {
      // Le cœur du point 5 : on lit la progression AVANT de changer le temps, on applique
      // la nouvelle durée, puis on restitue la même progression normalisée.
      const progress = this.timeProgress
      const wasPlaying = this.playing

      duration = next.duration ?? duration
      easing = next.easing ?? easing
      effect.updateTiming({ duration: duration * 1000, easing })

      animation.currentTime = progressToTime(progress, duration)
      if (wasPlaying) animation.play()
    },

    dispose() {
      // Sans cet appel, quitter une leçon laisserait une animation vivante — point 7 du
      // « terminé ». Une animation non annulée ne se voit pas à l'écran : elle s'accumule.
      animation.cancel()
      liveDrivers.delete(driver)
    },
  }

  liveDrivers.add(driver)
  return driver
}

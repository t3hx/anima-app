import type { TimeDriver } from '@transport/TimeDriver'
import { clampProgress } from '@transport/TimeDriver'

// jsdom n'implémente aucune API Web Animations, donc le vrai driver n'y tourne pas. Tout
// ce qui *consomme* un `TimeDriver` — barre de transport, scène — se teste contre celui-ci.
// C'est à cela que sert l'interface : le vrai driver est exercé dans Chromium
// (`tests/e2e/waapi-driver.spec.ts`), ses consommateurs le sont ici.

export interface FakeDriver extends TimeDriver {
  /** Avance le temps sans horloge réelle. */
  advance(progress: number): void
  readonly disposed: boolean
  readonly calls: readonly string[]
}

export const createFakeDriver = (duration = 2): FakeDriver => {
  let time = 0
  let playing = false
  let rate = 1
  let looping = false
  let disposed = false
  let easing = 'linear'
  let currentDuration = duration
  const calls: string[] = []

  return {
    calls,
    get duration() {
      return currentDuration
    },
    get playing() {
      return playing
    },
    get rate() {
      return rate
    },
    get looping() {
      return looping
    },
    get timeProgress() {
      return time
    },
    get easedProgress() {
      return time
    },
    get disposed() {
      return disposed
    },
    advance(progress) {
      time = clampProgress(progress)
    },
    play() {
      calls.push('play')
      playing = true
    },
    pause() {
      calls.push('pause')
      playing = false
    },
    seek(progress) {
      calls.push(`seek:${progress}`)
      time = clampProgress(progress)
    },
    setRate(next) {
      calls.push(`rate:${next}`)
      rate = next
    },
    setLoop(next) {
      calls.push(`loop:${next}`)
      looping = next
    },
    retime(next) {
      calls.push(`retime:${JSON.stringify(next)}`)
      currentDuration = next.duration ?? currentDuration
      easing = next.easing ?? easing
      void easing
    },
    dispose() {
      calls.push('dispose')
      disposed = true
    },
  }
}

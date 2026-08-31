import { clampProgress, progressToTime, timeToProgress } from '@transport/TimeDriver'
import { describe, expect, it } from 'vitest'

// Ce fichier ne teste que l'arithmétique du temps — la seule partie du transport qui
// tourne sous jsdom. **jsdom n'implémente aucune WAAPI** : `Animation`, `KeyframeEffect`,
// `document.timeline`, `element.animate` et `getAnimations` y sont tous `undefined`.
// La liaison au navigateur est donc testée dans un vrai Chromium :
// `tests/e2e/waapi-driver.spec.ts`. Ce fichier seul ne prouve rien du driver.

describe('clampProgress', () => {
  it('keeps a normalized progress inside its bounds', () => {
    expect(clampProgress(0.5)).toBe(0.5)
    expect(clampProgress(-2)).toBe(0)
    expect(clampProgress(3)).toBe(1)
  })

  it('treats a non-finite progress as the start rather than propagating NaN', () => {
    // Un scrub sur une durée nulle produit NaN ; le laisser passer fige la scène.
    expect(clampProgress(Number.NaN)).toBe(0)
    expect(clampProgress(Number.POSITIVE_INFINITY)).toBe(1)
  })
})

describe('progress and time', () => {
  it('converts a normalized progress into milliseconds', () => {
    expect(progressToTime(0.5, 2)).toBe(1000)
    expect(progressToTime(1, 2)).toBe(2000)
  })

  it('converts milliseconds back into a normalized progress', () => {
    expect(timeToProgress(1000, 2)).toBe(0.5)
    expect(timeToProgress(2000, 2)).toBe(1)
  })

  it('round-trips — this is what keeps a rebuild on the same progress', () => {
    // Point 5 du « terminé » : régler un paramètre pendant la lecture reconstruit
    // l'animation et reprend à la même progression normalisée.
    for (const progress of [0, 0.13, 0.5, 0.87, 1]) {
      expect(timeToProgress(progressToTime(progress, 2.4), 2.4)).toBeCloseTo(progress, 10)
    }
  })

  it('returns zero rather than NaN when the duration is zero', () => {
    // La méthode `set` de la leçon a une durée nulle : c'est un cas réel, pas un cas limite.
    expect(timeToProgress(0, 0)).toBe(0)
    expect(timeToProgress(500, 0)).toBe(0)
  })
})

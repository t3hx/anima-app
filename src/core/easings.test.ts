import { EASINGS, findEasing, sampleEasing } from '@core/easings'
import { describe, expect, it } from 'vitest'

// Les vignettes de courbe sont tracées « depuis les fonctions d'easing réelles » (handoff).
// Pas depuis un chemin SVG écrit à la main : un tracé en dur finit toujours par mentir sur
// la courbe réellement appliquée.
//
// Ce module ne pilote aucune animation — c'est le navigateur qui applique la courbe, via
// la chaîne CSS passée à la WAAPI. Il ne fait que la dessiner.

describe('catalogue', () => {
  it('offers six curves, as the mockup shows', () => {
    expect(EASINGS).toHaveLength(6)
  })

  it('gives every curve a CSS string the browser can actually apply', () => {
    for (const easing of EASINGS) {
      expect(easing.css).toMatch(/^(linear|ease|ease-in|ease-out|ease-in-out|cubic-bezier\(.+\))$/)
    }
  })

  it('starts with linear — the reference against which the others are read', () => {
    expect(EASINGS[0]?.id).toBe('linear')
  })

  it('finds a curve by id, and returns undefined for an unknown one', () => {
    expect(findEasing('ease-out')?.css).toBe('ease-out')
    expect(findEasing('nope')).toBeUndefined()
  })
})

describe('sampling', () => {
  it('pins both ends — a curve goes from 0 to 1, whatever its shape', () => {
    for (const easing of EASINGS) {
      const samples = sampleEasing(easing, 32)
      expect(samples[0]).toBeCloseTo(0, 4)
      expect(samples[samples.length - 1]).toBeCloseTo(1, 4)
    }
  })

  it('leaves linear as the identity', () => {
    const samples = sampleEasing(EASINGS[0] as (typeof EASINGS)[number], 11)
    samples.forEach((value, index) => {
      expect(value).toBeCloseTo(index / 10, 4)
    })
  })

  it('makes ease-out start faster than linear and ease-in start slower', () => {
    const quarter = 8
    const easeOut = sampleEasing(findEasing('ease-out') as (typeof EASINGS)[number], 33)[quarter]
    const easeIn = sampleEasing(findEasing('ease-in') as (typeof EASINGS)[number], 33)[quarter]

    expect(easeOut).toBeGreaterThan(0.25)
    expect(easeIn).toBeLessThan(0.25)
  })

  it('matches the value Chromium computes for the same curve', () => {
    // Mesuré dans Chromium en planification : `cubic-bezier(0.25, 1, 0.5, 1)` à 25 % du
    // temps rend 0.6885899020168309. Le traceur doit dire la même chose que le moteur,
    // sinon la vignette dessine une courbe que la scène ne suit pas.
    const measured = sampleEasing({ id: 'probe', css: 'x', points: [0.25, 1, 0.5, 1] }, 5)[1]
    expect(measured).toBeCloseTo(0.6885899, 5)
  })

  it('lets an overshoot curve exceed 1 in the middle — that is the point of it', () => {
    const back = findEasing('back-out') as (typeof EASINGS)[number]
    const samples = sampleEasing(back, 33)

    expect(Math.max(...samples)).toBeGreaterThan(1)
  })

  it('returns as many samples as asked for', () => {
    expect(sampleEasing(EASINGS[0] as (typeof EASINGS)[number], 17)).toHaveLength(17)
  })
})

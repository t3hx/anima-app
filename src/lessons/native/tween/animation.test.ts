import { animate } from '@lessons/native/tween/animation'
import { describe, expect, it } from 'vitest'

// La fonction d'animation est pure : elle se teste entièrement sans navigateur, sans DOM
// et sans three.js. C'est ce qui permet de vérifier le comportement pédagogique de la
// leçon — ce que chaque méthode fait réellement — plutôt que son rendu.

const values = { method: 'from', from: 10, to: 0, duration: 2, easing: 'ease-out', ghosts: true }

describe('the travel', () => {
  it('brings the object home when the start is declared', () => {
    expect(animate(0, values).x).toBe(10)
    expect(animate(1, values).x).toBe(0)
    expect(animate(0.5, values).x).toBe(5)
  })

  it('sends the object out when the target is declared', () => {
    // `to` déclare l'arrivée : le départ est la keyframe implicite, donc le repos.
    const goingOut = { ...values, method: 'to', to: 8 }

    expect(animate(0, goingOut).x).toBe(0)
    expect(animate(1, goingOut).x).toBe(8)
  })

  it('honours both ends when both are declared', () => {
    const both = { ...values, method: 'fromTo', from: -6, to: 9 }

    expect(animate(0, both).x).toBe(-6)
    expect(animate(1, both).x).toBe(9)
    expect(animate(0.5, both).x).toBe(1.5)
  })

  it('makes `from` and `fromTo` coincide when `to` is the rest position', () => {
    // La méthode change ce que le code écrit ; ici les deux décrivent le même trajet, et
    // c'est le propos de la leçon : `fromTo` l'écrit en entier, `from` en déduit la moitié.
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      expect(animate(progress, { ...values, method: 'fromTo', to: 0 }).x).toBe(
        animate(progress, { ...values, method: 'from' }).x,
      )
    }
  })

  it('jumps instead of travelling with `set`, and the jump is visible', () => {
    // Le saut est **au milieu**, pas à la fin. Placé en fin de course, il ne durait qu'une
    // image : techniquement « sans trajet », et invisible — donc sans valeur pédagogique.
    // Ici la valeur tient la première moitié, saute, et tient la seconde.
    const set = { ...values, method: 'set', from: 10, to: -4 }

    expect(animate(0, set).x).toBe(10)
    expect(animate(0.49, set).x).toBe(10)
    expect(animate(0.5, set).x).toBe(-4)
    expect(animate(1, set).x).toBe(-4)
  })

  it('passes through no intermediate position with `set`', () => {
    // La preuve que rien n'est interpolé : sur cent instants, on ne voit jamais que les
    // deux extrémités.
    const set = { ...values, method: 'set', from: 10, to: -4 }
    const seen = new Set(Array.from({ length: 101 }, (_, index) => animate(index / 100, set).x))

    expect([...seen].sort((a, b) => a - b)).toEqual([-4, 10])
  })

  it('follows the declared start, whatever it is — including a negative one', () => {
    expect(animate(0, { ...values, from: -7 }).x).toBe(-7)
    expect(animate(1, { ...values, from: -7 }).x).toBe(0)
  })

  it('never leaves the cube stuck when both ends are equal', () => {
    const still = { ...values, method: 'fromTo', from: 3, to: 3 }
    expect(animate(0.5, still).x).toBe(3)
  })
})

describe('the eased progress is what it receives', () => {
  it('does not apply any curve of its own', () => {
    // La courbe est appliquée par le navigateur, jamais ici (invariant : aucun moteur
    // d'animation maison). La fonction est donc strictement linéaire en `progress`.
    const a = animate(0.3, values).x
    const b = animate(0.6, values).x
    const c = animate(0.9, values).x

    expect(b - a).toBeCloseTo(c - b, 10)
  })
})

describe('the ghost trail', () => {
  it('follows the declared toggle', () => {
    expect(animate(0.5, values).showGhosts).toBe(true)
    expect(animate(0.5, { ...values, ghosts: false }).showGhosts).toBe(false)
  })
})

describe('missing values', () => {
  it('falls back to the descriptor defaults rather than producing NaN', () => {
    // Le store est vide une fraction de seconde au chargement ; une position NaN fige la
    // scène sans le moindre message.
    expect(animate(0, {}).x).toBe(10)
    expect(Number.isNaN(animate(0.5, {}).x)).toBe(false)
  })
})

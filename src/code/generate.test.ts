import { generateCode, joinLines, linesForParam } from '@code/generate'
import type { CodeTemplate } from '@core/types'
import { describe, expect, it } from 'vitest'

// Règle fondatrice du produit (spec §3) : **le code affiché est dérivé des valeurs
// courantes, jamais saisi en dur**. Le bouton « copier » copie ce qui est affiché, et ce
// qui est affiché doit être exactement ce qui s'exécute.
//
// C'est du calcul pur : ça se teste sans DOM, et c'est le premier endroit où un écart
// entre la scène et le code se verrait.

const template: CodeTemplate = {
  tab: 'JS',
  render: (values) => [
    { text: 'const effect = new KeyframeEffect(null, [{ offset: 0 }, { offset: 1 }], {' },
    { text: `  duration: ${Number(values.duration) * 1000},`, paramIds: ['duration'] },
    { text: `  easing: '${String(values.easing)}',`, paramIds: ['easing'] },
    { text: '})' },
  ],
}

describe('generateCode', () => {
  it('reflects the current values, not the defaults', () => {
    const lines = generateCode(template, { duration: 3.5, easing: 'ease-in' })

    expect(lines[1]?.text).toBe('  duration: 3500,')
    expect(lines[2]?.text).toBe("  easing: 'ease-in',")
  })

  it('changes when a value changes — nothing is memoised behind our back', () => {
    const first = generateCode(template, { duration: 2, easing: 'linear' })
    const second = generateCode(template, { duration: 4, easing: 'linear' })

    expect(first[1]?.text).not.toBe(second[1]?.text)
  })

  it('keeps the paramIds the template declared', () => {
    const lines = generateCode(template, { duration: 2, easing: 'linear' })

    expect(lines[1]?.paramIds).toEqual(['duration'])
    expect(lines[0]?.paramIds).toBeUndefined()
  })
})

describe('linesForParam', () => {
  it('finds every line a parameter highlights', () => {
    const lines = generateCode(template, { duration: 2, easing: 'linear' })

    expect(linesForParam(lines, 'duration')).toEqual([1])
    expect(linesForParam(lines, 'easing')).toEqual([2])
  })

  it('returns nothing for a parameter no line claims', () => {
    const lines = generateCode(template, { duration: 2, easing: 'linear' })

    expect(linesForParam(lines, 'ghosts')).toEqual([])
  })

  it('finds several lines when a parameter drives several', () => {
    const multi: CodeTemplate = {
      tab: 'JS',
      render: () => [
        { text: 'a', paramIds: ['from'] },
        { text: 'b' },
        { text: 'c', paramIds: ['from', 'duration'] },
      ],
    }

    expect(linesForParam(generateCode(multi, {}), 'from')).toEqual([0, 2])
  })
})

describe('joinLines', () => {
  it('produces exactly what the copy button puts on the clipboard', () => {
    const lines = generateCode(template, { duration: 2, easing: 'linear' })

    expect(joinLines(lines)).toBe(
      [
        'const effect = new KeyframeEffect(null, [{ offset: 0 }, { offset: 1 }], {',
        '  duration: 2000,',
        "  easing: 'linear',",
        '})',
      ].join('\n'),
    )
  })

  it('carries no highlight markup — the clipboard gets code, not HTML', () => {
    const text = joinLines(generateCode(template, { duration: 2, easing: 'linear' }))

    expect(text).not.toMatch(/<|>/)
  })
})

describe('the whole point', () => {
  it('never returns a line the template did not compute from the values', () => {
    // Si un jour ce test demande d'ajouter une ligne fixe, c'est que le code affiché a
    // cessé d'être dérivé — la fonctionnalité du produit, pas un détail.
    const values = { duration: 1.25, easing: 'back-out' }
    const text = joinLines(generateCode(template, values))

    expect(text).toContain('1250')
    expect(text).toContain('back-out')
  })
})

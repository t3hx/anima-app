import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { App } from '@/App'

// FR8 — les alias doivent résoudre à l'identique dans Vite, TypeScript et Vitest.
// Une divergence entre les trois ne se voit qu'au premier import réel, donc trop tard :
// c'est le risque le plus coûteux du lot 0, et il se vérifie, il ne se relit pas.

// Lecture depuis la racine du projet : sous jsdom, import.meta.url ne pointe pas
// où on l'attend.
const read = (name: string) => readFileSync(join(process.cwd(), name), 'utf8')

const aliasNames = (source: string) =>
  [...source.matchAll(/'(@[\w-]*)(?:\/\*)?'/g)].map((m) => m[1])

describe('path aliases', () => {
  it('resolves an aliased import at runtime', () => {
    expect(typeof App).toBe('function')
  })

  it('declares the same alias names in vite.config.ts and tsconfig.json', () => {
    const viteAliases = new Set(aliasNames(read('vite.config.ts')))
    const tsAliases = new Set(
      Object.keys(JSON.parse(read('tsconfig.json')).compilerOptions.paths).map((key) =>
        key.replace(/\/\*$/, ''),
      ),
    )
    expect([...viteAliases].sort()).toEqual([...tsAliases].sort())
  })

  it('covers every directory of the spec section 12 layout', () => {
    const expected = [
      '@',
      '@code',
      '@controls',
      '@core',
      '@i18n',
      '@lessons',
      '@scenes',
      '@shell',
      '@transport',
    ]
    expect([...new Set(aliasNames(read('vite.config.ts')))].sort()).toEqual(expected)
  })
})

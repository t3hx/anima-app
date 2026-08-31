import { fr } from '@i18n/fr'
import type { I18nKey, Locale } from '@i18n/translate'
import { createTranslator, LOCALES, translate } from '@i18n/translate'
import { describe, expect, it } from 'vitest'

// Invariant : aucune chaîne traduisible n'est écrite en dur. C'est la seule dette du
// projet qu'on ne pourra pas rattraper à moindre coût (spec §7), donc elle se tient par le
// compilateur, pas par la relecture — d'où `I18nKey` resserré sur les clés réelles.
//
// Rappel de méthode : les assertions de type de ce fichier se constatent avec
// `npm run typecheck`, jamais avec `npm run test` (voir 03-implementation.md).

describe('locales', () => {
  it('ships French and English, French first', () => {
    expect(LOCALES).toEqual(['fr', 'en'])
  })

  it('has no untranslated French entry', () => {
    for (const [key, value] of Object.entries(fr)) {
      expect(value, `fr.${key} is empty`).not.toBe('')
    }
  })
})

describe('translate', () => {
  it('returns the French string for a known key', () => {
    expect(translate('fr', 'group.values')).toBe('VALEURS')
  })

  it('falls back to French when the locale has no entry — English is empty at MVP', () => {
    expect(translate('en', 'group.values')).toBe('VALEURS')
  })
})

describe('createTranslator', () => {
  it('prefers the primary dictionary over the fallback', () => {
    const t = createTranslator({ 'group.values': 'VALUES' }, fr)
    expect(t('group.values')).toBe('VALUES')
  })

  it('falls back key by key, not dictionary by dictionary', () => {
    const t = createTranslator({ 'group.values': 'VALUES' }, fr)
    expect(t('group.values')).toBe('VALUES')
    expect(t('group.method')).toBe('MÉTHODE')
  })

  it('never returns undefined — a missing key would print "undefined" on screen', () => {
    const t = createTranslator({}, fr)
    for (const key of Object.keys(fr) as I18nKey[]) {
      expect(typeof t(key)).toBe('string')
    }
  })
})

describe('the type of a key', () => {
  it('rejects a key the French dictionary does not declare', () => {
    // @ts-expect-error 'group.nope' n'est pas une clé du dictionnaire
    const key: I18nKey = 'group.nope'
    expect(typeof key).toBe('string')
  })

  it('rejects a locale outside the declared list', () => {
    // @ts-expect-error 'de' n'est pas une locale du projet
    const locale: Locale = 'de'
    expect(typeof locale).toBe('string')
  })
})

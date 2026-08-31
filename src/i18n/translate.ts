import { en } from '@i18n/en'
import { fr } from '@i18n/fr'

/** Clé du dictionnaire. Dérivée du français, la locale de référence. */
export type I18nKey = keyof typeof fr

export const LOCALES = ['fr', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export type Dictionary = Partial<Record<I18nKey, string>>

const dictionaries: Record<Locale, Dictionary> = { fr, en }

/**
 * Le repli se fait **clé par clé**, pas dictionnaire par dictionnaire : une traduction
 * anglaise partielle affiche l'anglais là où il existe et le français ailleurs, plutôt que
 * de basculer tout l'écran dans une seule langue.
 */
export const createTranslator =
  (primary: Dictionary, fallback: typeof fr) =>
  (key: I18nKey): string =>
    primary[key] ?? fallback[key]

export const translate = (locale: Locale, key: I18nKey): string =>
  createTranslator(dictionaries[locale], fr)(key)

export const isLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value)

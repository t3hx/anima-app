import { type I18nKey, type Locale, translate } from '@i18n/translate'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

// La locale active. L'URL en est la source de vérité — ce store n'en est que le miroir,
// alimenté par la route (voir `@shell/routes`). L'inverse casserait le partage d'URL :
// un lien doit restituer la langue, pas la préférence locale du visiteur.

export const DEFAULT_LOCALE: Locale = 'fr'

interface LocaleState {
  readonly locale: Locale
  setLocale: (locale: Locale) => void
}

export const localeStore = createStore<LocaleState>()((set) => ({
  locale: DEFAULT_LOCALE,
  setLocale: (locale) => set({ locale }),
}))

export const useLocale = (): Locale => useStore(localeStore, (state) => state.locale)

/** Rend `t`. Les composants n'écrivent jamais de chaîne traduisible en dur. */
export const useTranslation = (): ((key: I18nKey) => string) => {
  const locale = useLocale()
  return (key) => translate(locale, key)
}

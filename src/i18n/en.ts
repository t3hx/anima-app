import type { I18nKey } from '@i18n/translate'

// L'anglais arrive au lot 8. Le fichier existe vide dès maintenant parce que l'ossature
// i18n est du lot 1 : ce qui coûte cher, ce n'est pas de traduire, c'est de retrouver les
// chaînes écrites en dur trois lots plus tard.
//
// `Partial` est délibéré : une clé absente retombe sur le français, elle ne casse rien.

export const en: Partial<Record<I18nKey, string>> = {}

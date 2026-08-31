import { useTranslation } from '@i18n/localeStore'

// Écran d'accueil provisoire. La navigation à deux niveaux (maquette 2f) le remplace en
// T009 ; il existe pour que `/fr` ne soit pas une page blanche.

export function Home() {
  const t = useTranslation()
  return (
    <main>
      {/* « Anima Lab » est un nom propre : il ne passe pas par le dictionnaire. */}
      <h1>Anima Lab</h1>
      <p>{t('home.tagline')}</p>
    </main>
  )
}

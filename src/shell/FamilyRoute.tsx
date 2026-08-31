import { loadFamily } from '@core/lessonRegistry'
import type { Family, Lesson } from '@core/types'
import { useTranslation } from '@i18n/localeStore'
import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router'

// `/fr/native` — l'entrée d'une famille. Elle mène à sa première leçon.
//
// Cette route manquait : la navigation pointait vers `/fr/native` alors qu'aucune route ne
// correspondait, et la page restait vide sous le chrome. Découvert en écrivant le scénario
// de fuite, qui avait besoin de quitter une leçon **sans recharger la page**.

const FAMILIES: readonly string[] = ['native', 'gsap', 'shaders']

const isFamily = (value: string | undefined): value is Family =>
  value !== undefined && FAMILIES.includes(value)

export function FamilyRoute() {
  const t = useTranslation()
  const { locale, family } = useParams()
  const [lessons, setLessons] = useState<readonly Lesson[] | null>(null)

  useEffect(() => {
    if (!isFamily(family)) {
      setLessons([])
      return
    }
    let live = true
    loadFamily(family).then((loaded) => {
      if (live) setLessons(loaded)
    })
    return () => {
      live = false
    }
  }, [family])

  if (lessons === null) return null

  const first = lessons[0]
  if (first) return <Navigate to={`/${locale}/${first.family}/${first.slug}`} replace />

  // Une famille dont les leçons ne sont pas encore écrites — le cas de `gsap` et
  // `shaders` au lot 1. Le dire plutôt que d'afficher une page blanche.
  return (
    <main className="family-empty">
      <p data-testid="family-empty">{t('family.empty')}</p>
    </main>
  )
}

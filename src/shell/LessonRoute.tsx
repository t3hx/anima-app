import { findLesson } from '@core/lessonRegistry'
import type { Family, Lesson } from '@core/types'
import { useTranslation } from '@i18n/localeStore'
import { LessonShell } from '@shell/LessonShell'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'

// Résout la leçon désignée par l'URL et la passe au shell. Rien d'autre : le cycle de vie
// du store et de la scène appartient au shell, qui est aussi celui qui les libère.

const FAMILIES: readonly string[] = ['native', 'gsap', 'shaders']

const isFamily = (value: string | undefined): value is Family =>
  value !== undefined && FAMILIES.includes(value)

type Resolution =
  | { readonly status: 'loading' }
  | { readonly status: 'done'; readonly lesson: Lesson | undefined }

export function LessonRoute() {
  const t = useTranslation()
  const { family, slug } = useParams()
  const [resolution, setResolution] = useState<Resolution>({ status: 'loading' })

  useEffect(() => {
    if (!isFamily(family) || slug === undefined) {
      setResolution({ status: 'done', lesson: undefined })
      return
    }

    let live = true
    setResolution({ status: 'loading' })
    findLesson(family, slug).then((lesson) => {
      if (live) setResolution({ status: 'done', lesson })
    })

    return () => {
      live = false
    }
  }, [family, slug])

  if (resolution.status === 'loading') return null

  if (!resolution.lesson) {
    return <p data-testid="lesson-missing">{t('lesson.missing')}</p>
  }

  // Pas de `div` intermédiaire : un conteneur sans hauteur casse la chaîne des hauteurs
  // en pourcentage, et la mise en page du shell ne tient plus dès que le rail s'allonge.
  return <LessonShell lesson={resolution.lesson} />
}

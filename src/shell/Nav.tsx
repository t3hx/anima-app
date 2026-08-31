import { globalIndex, loadFamily, TOTAL_LESSONS } from '@core/lessonRegistry'
import type { Family, Lesson } from '@core/types'
import { useTranslation } from '@i18n/localeStore'
import { ReducedMotionToggle } from '@shell/ReducedMotionToggle'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import './Nav.css'

// Navigation à deux niveaux (maquette 2f) : rangée 1 les familles, rangée 2 les leçons de
// la famille active. La teinte de la famille colore tout l'écran via `data-family`.
//
// Seule la famille active est chargée : c'est ce qui rend le découpage par chunk réel.

const FAMILIES: readonly Family[] = ['native', 'gsap', 'shaders']

const FAMILY_KEYS = {
  native: 'family.native',
  gsap: 'family.gsap',
  shaders: 'family.shaders',
} as const

const isFamily = (value: string | undefined): value is Family =>
  value !== undefined && (FAMILIES as readonly string[]).includes(value)

export function Nav() {
  const t = useTranslation()
  const { locale, family, slug } = useParams()
  const [lessons, setLessons] = useState<readonly Lesson[]>([])

  const activeFamily: Family = isFamily(family) ? family : 'native'
  const activeLesson = lessons.find((candidate) => candidate.slug === slug)

  useEffect(() => {
    let live = true
    loadFamily(activeFamily).then((loaded) => {
      if (live) setLessons(loaded)
    })
    return () => {
      live = false
    }
  }, [activeFamily])

  return (
    <header className="nav" data-family={activeFamily}>
      <div className="nav__band">
        <div className="nav__row nav__row--families">
          <Link to={`/${locale}`} className="nav__brand" aria-label={t('chrome.home')}>
            {/* « Anima Lab » est un nom propre : il ne passe pas par le dictionnaire. */}
            <span className="nav__logo" aria-hidden="true" />
            Anima Lab
          </Link>

          <nav className="nav__families" aria-label={t('chrome.families')}>
            {FAMILIES.map((candidate) => (
              <Link
                key={candidate}
                to={`/${locale}/${candidate}`}
                className="nav__family"
                data-family={candidate}
                {...(candidate === activeFamily ? { 'aria-current': 'page' as const } : {})}
              >
                <span className="nav__dot" aria-hidden="true" />
                {t(FAMILY_KEYS[candidate])}
              </Link>
            ))}
          </nav>

          <div className="nav__aside">
            <ReducedMotionToggle />
            {activeLesson ? (
              <span className="nav__counter" data-testid="lesson-counter">
                {globalIndex(activeLesson)} / {TOTAL_LESSONS}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <nav className="nav__row nav__row--lessons" aria-label={t('chrome.lessons')}>
        {lessons.map((lesson) => (
          <Link
            key={lesson.id}
            to={`/${locale}/${lesson.family}/${lesson.slug}`}
            className="nav__lesson"
            data-testid="lesson-pill"
            data-slug={lesson.slug}
            {...(lesson.slug === slug ? { 'aria-current': 'page' as const } : {})}
          >
            <span className="nav__lesson-order">{String(lesson.order).padStart(2, '0')}</span>
            {t(lesson.titleKey)}
          </Link>
        ))}
      </nav>
    </header>
  )
}

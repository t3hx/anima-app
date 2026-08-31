import { DEFAULT_LOCALE, localeStore } from '@i18n/localeStore'
import { isLocale } from '@i18n/translate'
import { CanvasLayer } from '@scenes/CanvasLayer'
import { FamilyRoute } from '@shell/FamilyRoute'
import { Home } from '@shell/Home'
import { LessonRoute } from '@shell/LessonRoute'
import { Nav } from '@shell/Nav'
import { useEffect } from 'react'
import type { RouteObject } from 'react-router'
import { Navigate, Outlet, useLocation, useParams } from 'react-router'

// Une route par leçon, préfixée par la locale dès le MVP (spec §7). Le segment de famille
// est stable en anglais quelle que soit la locale : changer de langue est un remplacement
// de préfixe, sans table de correspondance ni URL à réécrire.

/**
 * Valide le préfixe de locale, le reflète dans le store et dans `lang`, puis rend la
 * route enfant. Une locale inconnue est réécrite vers le français en conservant le reste
 * du chemin — un lien mal formé mène à la bonne leçon plutôt qu'à une impasse.
 */
function LocaleLayout() {
  const { locale } = useParams()
  const { pathname, search, hash } = useLocation()

  const valid = locale !== undefined && isLocale(locale)

  useEffect(() => {
    if (!valid || locale === undefined) return
    localeStore.getState().setLocale(locale)
    document.documentElement.lang = locale
  }, [valid, locale])

  if (!valid) {
    const rest = pathname.split('/').slice(2).join('/')
    const target = rest ? `/${DEFAULT_LOCALE}/${rest}` : `/${DEFAULT_LOCALE}`
    return <Navigate to={`${target}${search}${hash}`} replace />
  }

  return (
    <>
      {/*
        Le canvas est monté ICI, au-dessus des routes : c'est ce qui le rend persistant.
        Le descendre dans la leçon le remonterait à chaque navigation, et épuiserait à
        terme les contextes WebGL disponibles (spec §2, piège n°3).
      */}
      <CanvasLayer />
      <Nav />
      <Outlet />
    </>
  )
}

export const routes: RouteObject[] = [
  { path: '/', element: <Navigate to={`/${DEFAULT_LOCALE}`} replace /> },
  {
    path: '/:locale',
    element: <LocaleLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: ':family', element: <FamilyRoute /> },
      { path: ':family/:slug', element: <LessonRoute /> },
    ],
  },
]

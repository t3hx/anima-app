import { clearRegistry, registerFamily } from '@core/lessonRegistry'
import type { Lesson } from '@core/types'
import { DEFAULT_LOCALE, localeStore } from '@i18n/localeStore'
import { routes } from '@shell/routes'

// L'écran de leçon monte le canvas persistant et le driver ; jsdom n'a ni WebGL ni Web
// Animations. On substitue les deux frontières — ce fichier teste le routage, pas eux.
vi.mock('@react-three/fiber', () => {
  // `useThree` prend un sélecteur ; le simulacre doit donc porter un état, pas un objet
  // unique. C'est ce qui permet au canvas de publier son renderer, sa fonction de redemande
  // de rendu et sa taille comme il le fait dans un vrai navigateur.
  const fakeThreeState = {
    gl: {
      info: {
        memory: { geometries: 0, textures: 0 },
        programs: [],
        render: { frame: 0, calls: 0, triangles: 0 },
      },
    },
    invalidate: () => {},
    set: () => {},
    size: { width: 800, height: 500 },
    camera: { position: { set: () => {} }, lookAt: () => {} },
  }

  return {
    Canvas: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    useFrame: () => {},
    useThree: (selector?: (state: typeof fakeThreeState) => unknown) =>
      selector ? selector(fakeThreeState) : fakeThreeState,
  }
})

import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Routes préfixées par la locale dès le MVP (spec §7) : ajouter le préfixe après coup
// casserait toutes les URL déjà partagées. Le segment de famille reste stable en anglais
// quelle que soit la locale (décision D2 du plan) — `/fr/native/tween`, `/en/native/tween`.

const tween: Lesson = {
  id: 'native-tween',
  slug: 'tween',
  family: 'native',
  order: 2,
  titleKey: 'lesson.native-tween.title',
  scene: 'webgl',
  transport: 'timeline',
  params: [],
  code: [],
  animate: () => ({ x: 0, showGhosts: false }),
  timing: () => ({ duration: 2, easing: 'linear' }),
}

const at = (path: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return { router, ...render(<RouterProvider router={router} />) }
}

beforeEach(() => {
  clearRegistry()
  registerFamily('native', async () => [tween])
  localeStore.getState().setLocale(DEFAULT_LOCALE)
  document.documentElement.lang = ''
})

afterEach(() => {
  clearRegistry()
})

describe('locale prefix', () => {
  it('never serves a route without one — the bare root redirects', async () => {
    const { router } = at('/')
    await waitFor(() => expect(router.state.location.pathname).toBe('/fr'))
  })

  it('falls back to French on an unknown locale, keeping the rest of the path', async () => {
    const { router } = at('/de/native/tween')
    await waitFor(() => expect(router.state.location.pathname).toBe('/fr/native/tween'))
  })

  it('accepts English as a locale even though its dictionary is empty', async () => {
    const { router } = at('/en/native/tween')
    await waitFor(() => expect(router.state.location.pathname).toBe('/en/native/tween'))
  })
})

describe('document language', () => {
  it('sets lang from the URL, not from the browser', async () => {
    at('/en/native/tween')
    await waitFor(() => expect(document.documentElement.lang).toBe('en'))
  })

  it('follows the locale of the current route', async () => {
    at('/fr/native/tween')
    await waitFor(() => expect(document.documentElement.lang).toBe('fr'))
  })
})

describe('lesson resolution', () => {
  it('renders the lesson named by family and slug', async () => {
    at('/fr/native/tween')
    await waitFor(() => expect(screen.getByTestId('lesson-screen')).toBeInTheDocument())
    expect(screen.getByTestId('lesson-screen')).toHaveAttribute('data-lesson-id', 'native-tween')
  })

  it('says so, in the active locale, when the slug matches nothing', async () => {
    at('/fr/native/nope')
    await waitFor(() => expect(screen.getByTestId('lesson-missing')).toBeInTheDocument())
  })

  it('says so when the family matches nothing', async () => {
    at('/fr/quantum/tween')
    await waitFor(() => expect(screen.getByTestId('lesson-missing')).toBeInTheDocument())
  })
})

describe('locale store', () => {
  it('mirrors the URL — the URL is the source of truth, not the store', async () => {
    at('/en/native/tween')
    await waitFor(() => expect(localeStore.getState().locale).toBe('en'))
  })
})

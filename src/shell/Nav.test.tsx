import { clearRegistry, registerFamily } from '@core/lessonRegistry'
import { motionStore, prefersReducedMotion } from '@core/reducedMotion'
import type { Family, Lesson } from '@core/types'
import { Nav } from '@shell/Nav'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

// Navigation à deux niveaux (maquette 2f) : famille, puis leçon. La teinte de la famille
// active colore tout l'écran. Compteur sobre `n / 25` — pas de barre de progression, pas
// de célébration : ce n'est pas un jeu.

const lesson = (family: Family, slug: string, order: number): Lesson => ({
  id: `${family}-${slug}`,
  slug,
  family,
  order,
  titleKey: 'lesson.native-tween.title',
  scene: 'webgl',
  transport: 'timeline',
  params: [],
  code: [],
  animate: () => ({ x: 0, showGhosts: false }),
  timing: () => ({ duration: 2, easing: 'linear' }),
})

const renderNav = (path = '/fr/native/tween') => {
  const router = createMemoryRouter([{ path: '/:locale/:family/:slug', element: <Nav /> }], {
    initialEntries: [path],
  })
  return render(<RouterProvider router={router} />)
}

beforeEach(() => {
  clearRegistry()
  registerFamily('native', async () => [
    lesson('native', 'pipeline', 1),
    lesson('native', 'tween', 2),
  ])
  registerFamily('gsap', async () => [lesson('gsap', 'timeline', 2)])
  motionStore.getState().reset()
})

describe('first level — families', () => {
  it('lists the three families, translated', async () => {
    renderNav()

    expect(await screen.findByRole('link', { name: 'Socle natif' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'GSAP' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Shaders' })).toBeInTheDocument()
  })

  it('marks the active family for assistive technology, not only with colour', async () => {
    renderNav()

    const active = await screen.findByRole('link', { name: 'Socle natif' })
    expect(active).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'GSAP' })).not.toHaveAttribute('aria-current')
  })

  it('tints the whole screen with the active family accent', async () => {
    const { container } = renderNav()

    await waitFor(() =>
      expect(container.querySelector('[data-family]')).toHaveAttribute('data-family', 'native'),
    )
  })
})

describe('second level — lessons of the active family', () => {
  it('lists them in order, and only them', async () => {
    renderNav()

    const pills = await screen.findAllByTestId('lesson-pill')
    expect(pills.map((pill) => pill.getAttribute('data-slug'))).toEqual(['pipeline', 'tween'])
  })

  it('numbers them from the descriptor order, not from the array index', async () => {
    renderNav()

    const pills = await screen.findAllByTestId('lesson-pill')
    expect(pills[0]).toHaveTextContent('01')
    expect(pills[1]).toHaveTextContent('02')
  })

  it('links to the locale-prefixed route of each lesson', async () => {
    renderNav()

    const pills = await screen.findAllByTestId('lesson-pill')
    expect(pills[1]).toHaveAttribute('href', '/fr/native/tween')
  })

  it('keeps the locale when switching family', async () => {
    renderNav('/en/native/tween')

    expect(await screen.findByRole('link', { name: 'GSAP' })).toHaveAttribute('href', '/en/gsap')
  })
})

describe('counter', () => {
  it('numbers the current lesson across the catalogue', async () => {
    renderNav()

    expect(await screen.findByTestId('lesson-counter')).toHaveTextContent('2 / 25')
  })

  it('counts past the earlier families, not from one inside the family', async () => {
    // `gsap.02` est la douzième leçon du catalogue, pas la deuxième.
    renderNav('/fr/gsap/timeline')

    expect(await screen.findByTestId('lesson-counter')).toHaveTextContent('12 / 25')
  })

  it('shows nothing when no lesson is active — no invented number', async () => {
    renderNav('/fr/native/nope')

    await screen.findAllByTestId('lesson-pill')
    expect(screen.queryByTestId('lesson-counter')).not.toBeInTheDocument()
  })
})

describe('reduced-motion switch', () => {
  it('is a labelled switch, reachable and operable from the keyboard', async () => {
    const user = userEvent.setup()
    renderNav()

    const toggle = await screen.findByRole('switch', { name: /motion réduit/i })
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    toggle.focus()
    await user.keyboard(' ')

    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(prefersReducedMotion()).toBe(true)
  })

  it('overrides the detected value in both directions', async () => {
    const user = userEvent.setup()
    renderNav()

    const toggle = await screen.findByRole('switch', { name: /motion réduit/i })
    await user.click(toggle)
    expect(prefersReducedMotion()).toBe(true)

    await user.click(toggle)
    expect(prefersReducedMotion()).toBe(false)
  })
})

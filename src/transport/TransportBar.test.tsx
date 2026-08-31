import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TransportBar } from '@transport/TransportBar'
import { describe, expect, it, vi } from 'vitest'
import { createFakeDriver } from '@/test/fakeDriver'

// Variante `timeline` (spec §4.3) : retour au début, lecture/pause, boucle, scrub, temps
// écoulé / durée, vitesse de 0.25× à 4× valeurs négatives incluses.
//
// La règle qui gouverne ce composant : **le scrub agit sur le driver, jamais sur l'état
// React**. Un scrub qui passe par un `useState` re-rend l'arbre soixante fois par seconde.

const renderBar = (duration = 2) => {
  const driver = createFakeDriver(duration)
  const view = render(<TransportBar driver={driver} />)
  return { driver, ...view }
}

describe('playback', () => {
  it('plays and pauses from the same button', async () => {
    const user = userEvent.setup()
    const { driver } = renderBar()

    await user.click(screen.getByRole('button', { name: 'Lecture' }))
    expect(driver.playing).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Pause' }))
    expect(driver.playing).toBe(false)
  })

  it('is operable with the space bar, as the spec requires', async () => {
    const user = userEvent.setup()
    const { driver } = renderBar()

    screen.getByRole('button', { name: 'Lecture' }).focus()
    await user.keyboard(' ')

    expect(driver.playing).toBe(true)
  })

  it('goes back to the start without changing whether it plays', async () => {
    const user = userEvent.setup()
    const { driver } = renderBar()
    driver.advance(0.6)

    await user.click(screen.getByRole('button', { name: 'Revenir au début' }))

    expect(driver.timeProgress).toBe(0)
  })

  it('toggles looping, and says so to assistive technology', async () => {
    const user = userEvent.setup()
    const { driver } = renderBar()

    const loop = screen.getByRole('button', { name: 'Boucle' })
    expect(loop).toHaveAttribute('aria-pressed', 'false')

    await user.click(loop)

    expect(driver.looping).toBe(true)
    expect(loop).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('scrub', () => {
  // jsdom ne bouge pas un `input type="range"` aux flèches : valeur inchangée, aucun
  // événement émis (mesuré). L'élément reste natif — c'est ce qui donne le rôle `slider`,
  // la valeur annoncée et le réglage aux flèches gratuitement dans un vrai navigateur — et
  // le clavier est vérifié en bout en bout sur l'écran de leçon (T020).
  // Ici on teste la plomberie : un scrub va au driver et nulle part ailleurs.

  it('is a native slider — its bounds and value are announced without ARIA', () => {
    renderBar()

    // Un `input type="range"` porte les valeurs ARIA implicitement : `min`, `max` et
    // `value` suffisent. Les redoubler en `aria-*` est la façon habituelle de les faire
    // diverger. C'est aussi ce qui donne le réglage aux flèches sans une ligne de code.
    const scrub = screen.getByRole('slider', { name: 'Progression' })
    expect(scrub).toHaveAttribute('min', '0')
    expect(scrub).toHaveAttribute('max', '100')
    expect(scrub.tagName).toBe('INPUT')
  })

  it('sends the scrubbed position to the driver', () => {
    const { driver } = renderBar()

    fireEvent.input(screen.getByRole('slider', { name: 'Progression' }), {
      target: { value: '25' },
    })

    expect(driver.calls).toContain('seek:0.25')
    expect(driver.timeProgress).toBeCloseTo(0.25, 5)
  })

  it('drives the driver on every move, not once at the end', () => {
    const { driver } = renderBar()
    const scrub = screen.getByRole('slider', { name: 'Progression' })

    for (const value of ['10', '20', '30']) {
      fireEvent.input(scrub, { target: { value } })
    }

    // Trois mouvements, trois appels — rien n'a été absorbé ni groupé par un rendu.
    expect(driver.calls.filter((call) => call.startsWith('seek:'))).toHaveLength(3)
  })
})

describe('time readout', () => {
  it('shows elapsed over duration, in seconds', () => {
    const driver = createFakeDriver(2)
    driver.advance(0.38)

    render(<TransportBar driver={driver} />)

    expect(screen.getByTestId('transport-time')).toHaveTextContent('0.76 / 2.00 s')
  })

  it('writes the position into the DOM without a React render', () => {
    const driver = createFakeDriver(2)
    render(<TransportBar driver={driver} />)

    const before = screen.getByTestId('transport-time').textContent
    driver.advance(0.5)
    fireEvent.input(screen.getByRole('slider', { name: 'Progression' }), {
      target: { value: '50' },
    })

    expect(before).toBe('0.00 / 2.00 s')
    expect(screen.getByTestId('transport-time')).toHaveTextContent('1.00 / 2.00 s')
  })
})

describe('speed', () => {
  it('offers no speed control — deliberately absent from this lesson', () => {
    // Écart assumé à la spec §4.3. Le sélecteur fonctionnait ; l'humain a jugé qu'il
    // n'apportait rien ici et a demandé son retrait. Ce test existe pour que sa
    // réapparition soit une décision, pas un retour en arrière discret.
    renderBar()

    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('keeps the driver able to change rate, for the lessons where speed is the subject', () => {
    const { driver } = renderBar()

    driver.setRate(2)

    expect(driver.rate).toBe(2)
  })
})

describe('lifecycle', () => {
  it('stops its animation frame loop on unmount', () => {
    const cancel = vi.spyOn(globalThis, 'cancelAnimationFrame')
    const driver = createFakeDriver()
    const { unmount } = render(<TransportBar driver={driver} />)

    unmount()

    expect(cancel).toHaveBeenCalled()
    cancel.mockRestore()
  })
})

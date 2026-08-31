import { motionStore } from '@core/reducedMotion'
import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from '@/App'

// L'application monte le routeur et branche les deux réglages globaux. Le détail des
// routes se teste dans `src/shell/routes.test.tsx` ; ici on vérifie l'assemblage.
//
// Ce fichier existe surtout à cause d'un défaut réel : le câblage du mouvement réduit
// avait été perdu par une modification silencieusement sans effet, et **rien ne le
// testait**. Un composant racine qui ne fait « que » assembler mérite quand même un test :
// c'est précisément là que les branchements disparaissent sans bruit.

beforeEach(() => {
  motionStore.getState().reset()
  document.documentElement.removeAttribute('data-reduced-motion')
})

describe('App', () => {
  it('mounts the router and lands on the default locale', async () => {
    render(<App />)

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Anima Lab' })).toBeVisible())
    expect(document.documentElement.lang).toBe('fr')
  })

  it('publishes the effective reduced-motion preference to the stylesheets', async () => {
    render(<App />)

    await waitFor(() => expect(document.documentElement.dataset.reducedMotion).toBe('false'))

    act(() => {
      motionStore.getState().toggle()
    })

    // Sans ce câblage, l'interrupteur du chrome n'aurait aucun effet sur les transitions
    // d'interface — seulement sur les scènes.
    expect(document.documentElement.dataset.reducedMotion).toBe('true')
  })

  it('exposes the resource diagnostics used by the leak scenario', () => {
    render(<App />)

    expect(typeof window.__anima?.liveDrivers).toBe('function')
    expect(window.__anima?.liveDrivers()).toBe(0)
  })
})

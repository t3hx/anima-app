import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from '@/App'

// Preuve que le harnais jsdom + Testing Library rend réellement du DOM.
// Sans environnement jsdom, ce test échoue : c'est exactement ce qu'on veut vérifier.
describe('App', () => {
  it('renders into the DOM', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Anima Lab' })).toBeInTheDocument()
  })
})

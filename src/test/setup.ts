import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// StrictMode monte deux fois : le nettoyage entre tests doit être systématique,
// sinon un composant non démonté fausse le test suivant.
afterEach(() => {
  cleanup()
})

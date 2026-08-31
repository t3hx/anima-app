import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom n'implémente pas `ResizeObserver`. Le shell s'en sert pour publier le rectangle
// que le canvas doit couvrir ; sans ce bouchon, tout composant qui observe une taille
// échoue à l'instanciation. Le bouchon n'observe rien — les tailles réelles se vérifient
// dans un navigateur (`tests/e2e/scene-visible.spec.ts`).
class NoopResizeObserver implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver ??= NoopResizeObserver

// StrictMode monte deux fois : le nettoyage entre tests doit être systématique,
// sinon un composant non démonté fausse le test suivant.
afterEach(() => {
  cleanup()
})

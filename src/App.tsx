import { installDiagnostics } from '@core/diagnostics'
import { useReducedMotion, watchSystemPreference } from '@core/reducedMotion'
import { registerLessonFamilies } from '@lessons/registry'
import { routes } from '@shell/routes'
import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'

registerLessonFamilies()
installDiagnostics()

const router = createBrowserRouter(routes)

export function App() {
  const reduced = useReducedMotion()

  // La préférence système peut changer pendant la session. L'abonnement est explicite
  // plutôt qu'à l'import du module, pour rester testable et indépendant de l'ordre des
  // imports (voir `@core/reducedMotion`).
  useEffect(() => watchSystemPreference(), [])

  // Les feuilles de style lisent la préférence **effective** — celle qui tient compte de
  // l'interrupteur du chrome, pas seulement de `prefers-reduced-motion`.
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reduced)
  }, [reduced])

  return <RouterProvider router={router} />
}

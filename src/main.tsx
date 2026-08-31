import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/App'
import '@/styles/base.css'

// StrictMode monte les composants deux fois en développement. C'est délibéré :
// toute animation ajoutée plus tard doit être idempotente et correctement nettoyée.
const container = document.getElementById('root')
if (!container) {
  throw new Error('Root container #root is missing from index.html')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

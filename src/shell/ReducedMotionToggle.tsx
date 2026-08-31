import { motionStore, useReducedMotion } from '@core/reducedMotion'
import { useTranslation } from '@i18n/localeStore'

import './ReducedMotionToggle.css'

// L'interrupteur `prefers-reduced-motion` du chrome. Il est visible en permanence : sur ce
// site, c'est un objet d'enseignement autant qu'un réglage (maquette 2f).
//
// Rôle `switch` plutôt qu'une case à cocher stylée : c'est ce que la technologie
// d'assistance annonce correctement, et `Espace` le bascule sans code supplémentaire.

export function ReducedMotionToggle() {
  const t = useTranslation()
  const reduced = useReducedMotion()

  return (
    <button
      type="button"
      role="switch"
      aria-checked={reduced}
      className="motion-toggle"
      onClick={() => motionStore.getState().toggle()}
    >
      <span className="motion-toggle__track" aria-hidden="true">
        <span className="motion-toggle__thumb" />
      </span>
      <span className="motion-toggle__label">{t('chrome.reducedMotion')}</span>
    </button>
  )
}

import { paramStore, useParamValue } from '@core/paramStore'
import type { ToggleParam } from '@core/types'
import { useTranslation } from '@i18n/localeStore'

export function ToggleControl({ param }: { param: ToggleParam }) {
  const t = useTranslation()
  const checked = useParamValue(param.id) === true

  return (
    <div className="control control--toggle" data-testid={`control-${param.id}`}>
      <span className="control__label">{param.label}</span>
      {param.glossKey ? <span className="control__gloss">· {t(param.glossKey)}</span> : null}

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={param.label}
        className="control__switch"
        onClick={() => paramStore.getState().setValue(param.id, !checked)}
      >
        <span className="control__switch-thumb" aria-hidden="true" />
      </button>
    </div>
  )
}

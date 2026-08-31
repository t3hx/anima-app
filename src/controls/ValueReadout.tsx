import { useParamValue } from '@core/paramStore'

// Le **seul** composant qui a le droit de re-rendre pendant qu'on déplace un curseur
// (spec §6). Il est isolé pour cette raison : s'il vivait dans `SliderControl`, chaque
// mouvement re-rendrait le curseur lui-même, et l'affaire serait perdue.

export interface ValueReadoutProps {
  readonly paramId: string
  readonly unit?: string
  readonly decimals?: number
}

export function ValueReadout({ paramId, unit, decimals = 1 }: ValueReadoutProps) {
  const value = useParamValue(paramId)
  const text = typeof value === 'number' ? value.toFixed(decimals) : String(value ?? '')

  return (
    <span className="control__value" data-testid={`value-${paramId}`}>
      {text}
      {unit ? <span className="control__unit">{unit}</span> : null}
    </span>
  )
}

import { paramStore, useParamValue } from '@core/paramStore'
import type { ChoiceParam } from '@core/types'
import { useTranslation } from '@i18n/localeStore'

// Grille de cartes. Le libellé est **technique** — `to`, `fromTo` — en monospace, non
// traduit ; seule la glose passe par le dictionnaire (spec §7).
//
// Des boutons radio réels plutôt que des `div` cliquables : la navigation aux flèches
// entre options et l'annonce du groupe viennent gratuitement.

export function ChoiceControl({ param }: { param: ChoiceParam }) {
  const t = useTranslation()
  const spec = param.control
  const current = useParamValue(param.id)

  return (
    <fieldset className="control control--choice" data-testid={`control-${param.id}`}>
      <legend className="visually-hidden">{param.label}</legend>
      <div className="control__cards">
        {spec.options.map((option) => (
          <label key={option.value} className="control__card">
            <input
              type="radio"
              name={param.id}
              value={option.value}
              checked={current === option.value}
              onChange={() => paramStore.getState().setValue(param.id, option.value)}
            />
            <span className="control__card-label">{option.label}</span>
            {option.glossKey ? (
              <span className="control__card-gloss">{t(option.glossKey)}</span>
            ) : null}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

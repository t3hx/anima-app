import { EASINGS, sampleEasing } from '@core/easings'
import { paramStore, useParamValue } from '@core/paramStore'
import type { EaseParam } from '@core/types'

// Le seul contrôle au rendu spécialisé (spec §4.4) : des vignettes de courbe tracées en
// SVG **depuis les fonctions réelles**, jamais depuis un chemin écrit à la main. Un tracé
// en dur finit par mentir sur la courbe que la scène applique vraiment.

const SAMPLES = 28

// Le `viewBox` a la proportion réelle de la vignette. Une version précédente était haute
// de 160 unités pour 34 px de rendu : le tracé occupait un sixième de la boîte et n'était
// tout simplement pas lisible.
const VIEW_W = 100
const VIEW_H = 46

/** Marge haute, pour laisser passer le dépassement de `back-out` sans le couper. */
const TOP = 6
const BOTTOM = 40

/** Le SVG a l'origine en haut à gauche ; une courbe se lit du bas vers le haut. */
const toPath = (values: readonly number[]): string =>
  values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * VIEW_W
      const y = BOTTOM - value * (BOTTOM - TOP)
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

export function EaseControl({ param }: { param: EaseParam }) {
  const current = useParamValue(param.id)

  return (
    <fieldset className="control control--ease" data-testid={`control-${param.id}`}>
      <legend className="visually-hidden">{param.label}</legend>
      <div className="control__curves">
        {EASINGS.map((easing) => (
          <label key={easing.id} className="control__curve">
            <input
              type="radio"
              name={param.id}
              value={easing.id}
              checked={current === easing.id}
              onChange={() => paramStore.getState().setValue(param.id, easing.id)}
            />
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              aria-hidden="true"
              className="control__curve-svg"
            >
              <path
                className="control__curve-path"
                data-testid="ease-curve"
                d={toPath(sampleEasing(easing, SAMPLES))}
                fill="none"
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            </svg>
            <span className="control__curve-name">{easing.id}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

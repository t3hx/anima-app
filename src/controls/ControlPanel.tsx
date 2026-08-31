import { ChoiceControl } from '@controls/ChoiceControl'
import { EaseControl } from '@controls/EaseControl'
import { SliderControl } from '@controls/SliderControl'
import { ToggleControl } from '@controls/ToggleControl'
import { useConditionValues } from '@controls/useConditionValues'
import {
  type I18nKey,
  isChoiceParam,
  isEaseParam,
  isSliderParam,
  isToggleParam,
  type Param,
  type ParamValues,
} from '@core/types'
import { useTranslation } from '@i18n/localeStore'

import './controls.css'

// Le rail de contrôles, rendu **génériquement** depuis `params` et groupé par `group`.
//
// C'est ici que se joue l'invariant du projet : aucun JSX sur mesure par leçon. Si une
// leçon exigeait un jour d'ajouter une condition à ce fichier, c'est le contrat qui serait
// mauvais — pas ce fichier.

const controlFor = (param: Param) => {
  if (isSliderParam(param)) return <SliderControl param={param} />
  if (isChoiceParam(param)) return <ChoiceControl param={param} />
  if (isToggleParam(param)) return <ToggleControl param={param} />
  if (isEaseParam(param)) return <EaseControl param={param} />

  // Un type de contrôle ajouté au contrat sans composant correspondant est une erreur de
  // compilation ici, pas un trou silencieux à l'écran.
  return assertNever(param)
}

const assertNever = (value: never): never => {
  throw new Error(`Unhandled control type: ${JSON.stringify(value)}`)
}

/** Groupe en conservant l'ordre de première apparition — l'ordre du descripteur fait foi. */
const groupParams = (params: readonly Param[]): readonly (readonly [I18nKey, Param[]])[] => {
  const groups = new Map<I18nKey, Param[]>()
  for (const param of params) {
    const existing = groups.get(param.group)
    if (existing) existing.push(param)
    else groups.set(param.group, [param])
  }
  return [...groups.entries()]
}

export interface ControlPanelProps {
  readonly params: readonly Param[]
  /** Point d'observation des rendus, pour le test de non-rendu. */
  readonly onRender?: () => void
}

/** Un paramètre conditionnel disparaît quand sa condition n'est pas remplie. */
const isVisible = (param: Param, values: ParamValues): boolean => {
  const rule = param.visibleWhen
  if (!rule) return true
  return rule.oneOf.includes(String(values[rule.param] ?? ''))
}

export function ControlPanel({ params, onRender }: ControlPanelProps) {
  const t = useTranslation()
  onRender?.()

  // Cette lecture re-rend le panneau à chaque changement de valeur, ce qui serait
  // inacceptable — sauf qu'on ne lit que les paramètres dont dépend une condition. Ici
  // c'est `method`, un choix discret : quelques changements par session, pas soixante par
  // seconde. Les curseurs, eux, ne re-rendent toujours rien.
  const conditions = useConditionValues(params)
  const visible = params.filter((param) => isVisible(param, conditions))

  return (
    <div className="control-panel">
      {groupParams(visible).map(([group, members]) => (
        <section key={group} className="control-group" data-testid="control-group">
          <h2 className="control-group__label">{t(group)}</h2>
          {members.map((param) => (
            <div key={param.id}>{controlFor(param)}</div>
          ))}
        </section>
      ))}
    </div>
  )
}

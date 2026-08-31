import { ValueReadout } from '@controls/ValueReadout'
import { paramStore } from '@core/paramStore'
import type { SliderParam, SliderSpec } from '@core/types'
import { useTranslation } from '@i18n/localeStore'
import { useRef } from 'react'

// Curseur **non contrôlé au sens React** : la valeur part dans le store, l'affichage
// chiffré s'y abonne séparément, et l'élément `input` n'est jamais repiloté par un état
// parent. Un `value={...}` ici re-rendrait l'arbre à chaque frame d'un drag.

export interface SliderControlProps {
  readonly param: SliderParam
  /**
   * Point d'observation des rendus. C'est un point de mesure délibéré, pas un accessoire
   * de confort : « aucun rendu au-delà du composant qui affiche la valeur » est la
   * propriété centrale du projet (spec §6), et elle ne s'observe pas depuis l'extérieur —
   * un composant qui se re-rend à cause de son propre abonnement ne fait bouger aucun
   * parent. Sans ce point, le test resterait vert avec un curseur abonné à sa valeur.
   */
  readonly onRender?: () => void
}

/** Nombre de décimales déduit du pas déclaré — `0.1` en donne une, `1` aucune. */
const decimalsForStep = (step: number): number => {
  const text = String(step)
  const dot = text.indexOf('.')
  return dot === -1 ? 0 : text.length - dot - 1
}

/** Position de la valeur sur la piste, en 0..1. */
const fillRatio = (value: number, spec: SliderSpec): number =>
  spec.max === spec.min ? 0 : (value - spec.min) / (spec.max - spec.min)

export function SliderControl({ param, onRender }: SliderControlProps) {
  const t = useTranslation()
  onRender?.()
  const spec = param.control
  const decimals = decimalsForStep(spec.step)
  const track = useRef<HTMLDivElement>(null)

  return (
    <div className="control" data-testid={`control-${param.id}`}>
      <div className="control__head">
        <span className="control__label">{param.label}</span>
        {param.glossKey ? <span className="control__gloss">· {t(param.glossKey)}</span> : null}
        <ValueReadout
          paramId={param.id}
          decimals={decimals}
          {...(spec.unit ? { unit: spec.unit } : {})}
        />
      </div>

      {/*
        Le remplissage passe par une variable CSS écrite directement dans le DOM. Le faire
        transiter par un état React re-rendrait le curseur à chaque mouvement — ce que tout
        le reste de l'architecture existe pour éviter.
      */}
      <div
        className="control__track"
        ref={track}
        style={{ '--fill': fillRatio(param.default, spec) } as React.CSSProperties}
      >
        <input
          type="range"
          className="control__slider"
          aria-label={param.label}
          min={spec.min}
          max={spec.max}
          step={spec.step}
          defaultValue={param.default}
          onInput={(event) => {
            const value = Number(event.currentTarget.value)
            paramStore.getState().setValue(param.id, value)
            track.current?.style.setProperty('--fill', String(fillRatio(value, spec)))
          }}
        />
      </div>
    </div>
  )
}

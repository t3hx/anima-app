import { generateCode, joinLines } from '@code/generate'
import { useDeferredParamValues } from '@code/useDeferredValues'
import { useTouchedParam } from '@core/paramStore'
import type { CodeTemplate } from '@core/types'
import { useTranslation } from '@i18n/localeStore'
import { useState } from 'react'

import './CodePanel.css'

// Le tiroir de code. Replié sur une ligne par défaut, dépliable, onglets s'il y a
// plusieurs gabarits, bouton copier.
//
// Deux propriétés qui ne sont pas négociables :
//   - le contenu est **dérivé** des valeurs courantes, jamais saisi en dur ;
//   - la ligne du contrôle en cours de manipulation est surlignée, et reste lisible
//     pendant que la démo joue.

export interface CodePanelProps {
  readonly templates: readonly CodeTemplate[]
}

export function CodePanel({ templates }: CodePanelProps) {
  const t = useTranslation()
  // Déplié par défaut. Le code est la moitié du produit : le replier au chargement demande
  // un clic pour voir ce qu'on est venu voir. La maquette 2b le montre déplié.
  const [expanded, setExpanded] = useState(true)
  const [tabIndex, setTabIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  const values = useDeferredParamValues()
  const touched = useTouchedParam()

  const active = templates[tabIndex] ?? templates[0]
  const lines = active ? generateCode(active, values) : []

  // Replié, le tiroir n'a qu'une ligne pour dire de quoi il s'agit : autant que ce soit du
  // code. Un commentaire ou une ligne vide n'apprend rien de ce que fait la démonstration.
  const preview =
    lines.find((line) => line.text.trim() !== '' && !line.text.trim().startsWith('//'))?.text ?? ''

  const copy = () => {
    void navigator.clipboard?.writeText(joinLines(lines))
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <section className="code-panel" data-expanded={expanded}>
      <div className="code-panel__head">
        <span className="code-panel__glyph" aria-hidden="true">
          ‹/›
        </span>

        {expanded && templates.length > 1 ? (
          <div className="code-panel__tabs" role="tablist">
            {templates.map((template, index) => (
              <button
                key={template.tab}
                type="button"
                role="tab"
                aria-selected={index === tabIndex}
                className="code-panel__tab"
                onClick={() => setTabIndex(index)}
              >
                {template.tab}
              </button>
            ))}
          </div>
        ) : null}

        {expanded ? (
          <button type="button" className="code-panel__copy" onClick={copy}>
            {copied ? t('code.copied') : t('code.copy')}
          </button>
        ) : (
          <code className="code-panel__preview" data-testid="code-folded">
            {preview}
          </code>
        )}

        <button
          type="button"
          className="code-panel__chevron"
          aria-label={expanded ? t('code.collapse') : t('code.expand')}
          onClick={() => setExpanded(!expanded)}
        >
          <span aria-hidden="true">{expanded ? '▾' : '▴'}</span>
        </button>
      </div>

      {expanded ? (
        <pre className="code-panel__lines" data-testid="code-lines">
          {lines.map((line, index) => (
            <code
              // Le texte peut se répéter d'une ligne à l'autre ; l'index est ici la seule
              // identité stable, et l'ordre des lignes ne change jamais.
              // biome-ignore lint/suspicious/noArrayIndexKey: l'ordre des lignes est fixe
              key={index}
              className="code-panel__line"
              data-testid="code-line"
              data-highlighted={touched !== null && (line.paramIds?.includes(touched) ?? false)}
            >
              {line.text}
            </code>
          ))}
        </pre>
      ) : null}
    </section>
  )
}

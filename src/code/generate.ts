import type { CodeLine, CodeTemplate, ParamValues } from '@core/types'

// Le code affiché est **dérivé** des valeurs courantes, jamais saisi en dur (spec §3).
// C'est la moitié du produit : on règle un paramètre, on voit l'effet sur la scène et,
// dans le même écran, le code exact qui le produit.
//
// Calcul pur, sans DOM : c'est ici qu'un écart entre la scène et le code se verrait en
// premier.

export const generateCode = (template: CodeTemplate, values: ParamValues): readonly CodeLine[] =>
  template.render(values)

/** Indices des lignes que surligne un paramètre pendant son réglage. */
export const linesForParam = (lines: readonly CodeLine[], paramId: string): readonly number[] =>
  lines.reduce<number[]>((found, line, index) => {
    if (line.paramIds?.includes(paramId)) found.push(index)
    return found
  }, [])

/** Le texte exact que copie le bouton « copier » — du code, jamais du balisage. */
export const joinLines = (lines: readonly CodeLine[]): string =>
  lines.map((line) => line.text).join('\n')

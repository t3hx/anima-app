// Le contrat de données du projet. Écrit avant tout composant, comme l'exige la spec §3.
//
// Principe : une leçon est une donnée, pas un composant. Tout ce qui suit décrit un écran
// sans jamais nommer un composant. Le shell lit un `Lesson` et construit l'écran ; il n'a
// aucune connaissance des leçons individuelles.
//
// Ce fichier durcit le contrat de la spec §3 sur trois points :
//   - `ParamValues`, référencé par la spec mais jamais défini ;
//   - `Param` est une union discriminée, ce qui lie chaque type de contrôle au type de sa
//     valeur par défaut — un curseur dont le défaut est textuel ne compile pas ;
//   - `slug`, imposé par le routage préfixé par la locale (`/fr/native/tween`).

export type { I18nKey } from '@i18n/translate'

import type { I18nKey } from '@i18n/translate'

// `I18nKey` est la clé réelle du dictionnaire français, pas un alias de `string` : une
// chaîne traduisible écrite en dur dans un descripteur ne compile pas. C'est la seule
// façon de tenir l'invariant i18n autrement que par la relecture (spec §7).

export type SceneKind = 'webgl' | 'css-cube' | 'dom-grid' | 'scroll-column'

export type TransportKind = 'timeline' | 'scroll' | 'none'

export type Family = 'native' | 'gsap' | 'shaders'

/** Ce qu'un contrôle peut produire. */
export type ParamValue = number | string | boolean

/** Les valeurs courantes de la leçon, indexées par `Param['id']`. */
export type ParamValues = Readonly<Record<string, ParamValue>>

export interface SliderSpec {
  readonly type: 'slider'
  readonly min: number
  readonly max: number
  readonly step: number
  /** Unité affichée à côté de la valeur — technique, jamais traduite. */
  readonly unit?: string
}

export interface ChoiceOption {
  readonly value: string
  /**
   * Libellé technique, en monospace, jamais traduit — `to`, `fromTo`, `ease-out`. Les
   * maquettes ne montrent aucune option dont le libellé soit de la prose ; le jour où une
   * leçon en demande une, c'est le contrat qu'il faudra étendre, pas contourner.
   */
  readonly label: string
  readonly glossKey?: I18nKey
}

export interface ChoiceSpec {
  readonly type: 'choice'
  readonly options: readonly ChoiceOption[]
}

export interface ToggleSpec {
  readonly type: 'toggle'
}

/**
 * Sélecteur de courbe. Ne porte pas la liste des courbes : elle est commune à toutes les
 * leçons et vit dans `@core/easings`. Le rendu est spécialisé (vignettes SVG) — c'est le
 * seul cas où un contrôle n'est pas un champ générique.
 */
export interface EaseSpec {
  readonly type: 'ease'
}

export type ControlSpec = SliderSpec | ChoiceSpec | ToggleSpec | EaseSpec

/**
 * Condition d'affichage d'un paramètre : il n'apparaît que si un autre paramètre vaut
 * l'une des valeurs listées.
 *
 * Absente du contrat de la spec §3, et ajoutée sur un cas réel : `from` ne veut rien dire
 * quand la méthode est `to`, et `to` ne veut rien dire quand elle est `from`. Montrer les
 * deux curseurs en permanence laissait croire que les quatre méthodes lisent les deux
 * valeurs — l'inverse exact de ce que la leçon enseigne.
 *
 * C'est une **donnée**, pas une condition dans un composant : le shell reste ignorant des
 * leçons.
 */
export interface VisibilityRule {
  readonly param: string
  readonly oneOf: readonly string[]
}

interface ParamBase {
  /** Clé partout : contrôle, animation, surbrillance du code. En kebab-case. */
  readonly id: string
  /** Libellé technique, en monospace, jamais traduit — `duration`, `translateX`. */
  readonly label: string
  /** Glose traduite, affichée sous le libellé. */
  readonly glossKey?: I18nKey
  /** Titre du bloc de contrôles qui regroupe ce paramètre. */
  readonly group: I18nKey
  /** N'affiche ce paramètre que sous condition d'un autre. */
  readonly visibleWhen?: VisibilityRule
}

// Chaque variante est nommée : un composant de contrôle reçoit exactement la sienne, donc
// il lit `param.control` sans avoir besoin qu'on lui repasse la spécification à côté — et
// sans que le compilateur ait à deviner que `default` est un nombre.

export type SliderParam = ParamBase & { readonly control: SliderSpec; readonly default: number }
export type ChoiceParam = ParamBase & { readonly control: ChoiceSpec; readonly default: string }
export type ToggleParam = ParamBase & { readonly control: ToggleSpec; readonly default: boolean }
export type EaseParam = ParamBase & { readonly control: EaseSpec; readonly default: string }

/**
 * Un paramètre réglable. L'union est discriminée par `control.type`, ce qui lie le type de
 * contrôle au type de sa valeur : le compilateur refuse un curseur dont le défaut est une
 * chaîne, ou une bascule dont le défaut est un nombre.
 */
export type Param = SliderParam | ChoiceParam | ToggleParam | EaseParam

// TypeScript ne resserre pas `param` depuis `param.control.type` : un discriminant
// imbriqué ne remonte pas au type parent. Ces gardes le font explicitement, ce qui évite
// un `as` à chaque aiguillage — et un `as` est justement ce qui laisserait passer une
// variante mal appariée le jour où l'union grandira.

export const isSliderParam = (param: Param): param is SliderParam => param.control.type === 'slider'

export const isChoiceParam = (param: Param): param is ChoiceParam => param.control.type === 'choice'

export const isToggleParam = (param: Param): param is ToggleParam => param.control.type === 'toggle'

export const isEaseParam = (param: Param): param is EaseParam => param.control.type === 'ease'

export type CodeTab = 'CSS' | 'JS' | 'GLSL'

export interface CodeLine {
  readonly text: string
  /** Quels contrôles surlignent cette ligne pendant leur réglage. */
  readonly paramIds?: readonly string[]
}

export interface CodeTemplate {
  readonly tab: CodeTab
  /** Le code affiché est dérivé des valeurs courantes, jamais saisi en dur (spec §3). */
  readonly render: (values: ParamValues) => readonly CodeLine[]
}

/**
 * Ce qu'une frame d'animation produit pour la scène `webgl` : la position du cube sur
 * l'axe x, et l'affichage de la trace.
 *
 * Volontairement **spécifique à la scène du lot 1**. Généraliser maintenant reviendrait à
 * inventer une forme sur une seule scène réelle — l'invariant l'interdit. Le lot 3 amène
 * `dom-grid` et la scène divisée : c'est là qu'on saura de quoi ce type a besoin, et le
 * compilateur pointera tous les appelants à corriger.
 */
export interface CubeFrame {
  readonly x: number
  readonly showGhosts: boolean
}

/**
 * La fonction d'animation d'une leçon — **le seul code spécifique à une leçon** (spec §3).
 * Pure : une progression et des valeurs entrent, un état de scène sort. Elle ne touche ni
 * au DOM, ni à three.js, ni au store, ce qui la rend testable sans navigateur.
 *
 * Absente du contrat de la spec §3, qui décrit la leçon comme une donnée sans dire par où
 * passe son animation. C'est l'écriture de la première leçon qui l'a rendue nécessaire.
 */
export type CubeAnimation = (progress: number, values: ParamValues) => CubeFrame

/**
 * Le cadencement que la leçon demande au driver, dérivé de ses valeurs courantes.
 *
 * Ce champ existe parce que son absence a produit exactement le défaut que ce produit ne
 * peut pas tolérer : **le code affiché ne décrivait pas ce qui tournait**. Le shell
 * fabriquait le cadencement de son côté, en lisant un paramètre `easing` que la leçon
 * ignorait pour certaines méthodes ; le panneau montrait `linear`, le driver appliquait
 * `ease-out`, et le cube sautait au mauvais moment.
 *
 * En le confiant à la leçon, le gabarit de code et le driver lisent la même fonction.
 */
export interface Timing {
  /** En secondes. */
  readonly duration: number
  /** Courbe en syntaxe CSS, telle qu'elle part au navigateur. */
  readonly easing: string
}

export type LessonTiming = (values: ParamValues) => Timing

export type Metric = 'fps' | 'pipeline'

export interface SplitSpec {
  readonly leftKey: I18nKey
  readonly rightKey: I18nKey
  readonly metrics?: readonly Metric[]
}

export interface Lesson {
  /** Identifiant global, en kebab-case — `native-tween`. */
  readonly id: string
  /** Segment d'URL, stable quelle que soit la locale — `/fr/native/tween`. */
  readonly slug: string
  readonly family: Family
  readonly order: number
  readonly titleKey: I18nKey
  readonly scene: SceneKind
  /** Affiche la bascule WebGL / CSS. Exige que la leçon ait les deux implémentations. */
  readonly engineToggle?: boolean
  readonly split?: SplitSpec
  readonly transport: TransportKind
  readonly params: readonly Param[]
  /** Un gabarit par onglet. Le texte du concept n'est pas ici : c'est un markdown à part. */
  readonly code: readonly CodeTemplate[]
  /** La fonction d'animation. Vit dans `animation.ts`, à côté du descripteur. */
  readonly animate: CubeAnimation
  /** Durée et courbe demandées au driver, dérivées des valeurs courantes. */
  readonly timing: LessonTiming
  /**
   * La propriété animée, affichée en pilule au-dessus de la scène — `position.x`,
   * `rotation.z`. Libellé **technique**, en monospace, jamais traduit : c'est du code.
   */
  readonly property?: string
}

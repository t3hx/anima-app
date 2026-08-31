import { findEasing } from '@core/easings'
import type { CodeLine, Lesson, LessonTiming, ParamValues } from '@core/types'
import { animate } from '@lessons/native/tween/animation'

// `native-tween` — NATIF.02, « Anatomie d'un tween ».
//
// La leçon enseigne ce qu'est un tween — d'où l'on part, où l'on va, la forme du trajet —
// en se servant de la **Web Animations API**. La maquette montrait du GSAP sous une
// étiquette NATIF ; l'étiquette l'emporte (décision D1 du plan).
//
// Le bloc MÉTHODE y gagne : `to`, `from`, `fromTo` et `set` ne sont plus des noms de
// méthodes d'une bibliothèque, ce sont les **règles de keyframes implicites** de la WAAPI,
// qui sont un vrai sujet d'enseignement.
//
// Ce fichier est une donnée. Il ne contient aucun JSX, aucun composant, aucun style.

// Ce que chaque méthode écrit réellement en keyframes WAAPI. Une accolade vide est une
// keyframe **implicite** : le navigateur la remplit avec l'état courant de l'objet.
const KEYFRAMES: Record<string, (from: number, to: number) => readonly string[]> = {
  to: (_from, to) => [`[{}, { x: ${to} }]`],
  from: (from) => [`[{ x: ${from} }, {}]`],
  fromTo: (from, to) => [`[{ x: ${from} }, { x: ${to} }]`],
  // Deux keyframes au **même offset** : la valeur change d'un coup, sans rien entre les
  // deux. C'est la façon native d'écrire une discontinuité, et c'est ce qui rend le saut
  // visible — la moitié du temps ici, la moitié là.
  set: (from, to) => [
    '[',
    `  { x: ${from}, offset: 0 },`,
    `  { x: ${from}, offset: 0.5 },`,
    `  { x: ${to}, offset: 0.5 },`,
    `  { x: ${to}, offset: 1 },`,
    ']',
  ],
}

/**
 * Largeur maximale d'une ligne de code, en caractères.
 *
 * Le rail fait 344 px ; à 11 px de monospace, il en tient environ 46. Le code est donc
 * **écrit pour se lire sans défilement horizontal**, en revenant à la ligne plutôt qu'en
 * s'étalant. Ce n'est pas une coquetterie : un extrait qu'il faut faire défiler pour lire
 * ne se lit pas pendant qu'on règle un curseur, et c'est précisément à ce moment-là qu'on
 * le lit. Un test le vérifie sur toutes les combinaisons de réglages.
 */
export const MAX_CODE_COLUMNS = 44
/**
 * Durée et courbe réellement demandées au driver. **Le gabarit de code lit la même
 * fonction**, ce qui rend impossible que l'écran montre autre chose que ce qui tourne.
 *
 * Une version précédente laissait le shell calculer le cadencement de son côté : pour
 * `set`, le panneau affichait `linear` pendant que le driver appliquait `ease-out`, et le
 * cube sautait au premier tiers au lieu du milieu.
 */
const timing: LessonTiming = (values) => ({
  duration: Number(values.duration ?? 2),
  // `set` ne suit aucune courbe : ses keyframes sautent, il n'y a rien à interpoler.
  easing:
    String(values.method ?? 'from') === 'set'
      ? 'linear'
      : (findEasing(String(values.easing ?? 'ease-out'))?.css ?? 'linear'),
})

const render = (values: ParamValues): readonly CodeLine[] => {
  const method = String(values.method ?? 'from')
  const from = Number(values.from ?? 10)
  const to = Number(values.to ?? 0)
  const { duration, easing } = timing(values)

  return [
    ...(KEYFRAMES[method]?.(from, to) ?? ['[]']).map((text: string, index: number) => ({
      text: index === 0 ? `const frames = ${text}` : text,
      paramIds: ['method', 'from', 'to'],
    })),
    { text: '' },
    { text: 'const effect = new KeyframeEffect(' },
    { text: '  null,' },
    { text: '  frames,' },
    { text: '  {' },
    { text: `    duration: ${duration * 1000},`, paramIds: ['duration'] },
    { text: `    easing: '${easing}',`, paramIds: ['easing'] },
    { text: "    fill: 'both'," },
    { text: '  },' },
    { text: ')' },
    { text: 'new Animation(effect).play()' },
    { text: '' },
    { text: '// à chaque frame de rendu :' },
    { text: 'const t = effect.getComputedTiming()' },
    { text: 'mesh.position.x = mix(frames, t.progress)', paramIds: ['from', 'to'] },
  ]
}

export const tween: Lesson = {
  id: 'native-tween',
  slug: 'tween',
  family: 'native',
  order: 2,
  titleKey: 'lesson.native-tween.title',
  scene: 'webgl',
  transport: 'timeline',
  property: 'position.x',

  params: [
    {
      id: 'method',
      label: 'method',
      glossKey: 'param.method.gloss',
      group: 'group.method',
      control: {
        type: 'choice',
        options: [
          { value: 'to', label: 'to', glossKey: 'method.to.gloss' },
          { value: 'from', label: 'from', glossKey: 'method.from.gloss' },
          { value: 'fromTo', label: 'fromTo', glossKey: 'method.fromTo.gloss' },
          { value: 'set', label: 'set', glossKey: 'method.set.gloss' },
        ],
      },
      default: 'from',
    },
    {
      id: 'from',
      label: 'from',
      glossKey: 'param.from.gloss',
      group: 'group.values',
      // Plage calée sur les repères chiffrés de la scène, qui vont de 0 à 10. Au-delà, le
      // cube sortirait du cadre — et un réglage qui fait disparaître la démonstration
      // n'est pas un réglage.
      // `from` ne veut rien dire quand la méthode est `to` : la keyframe de départ y est
      // implicite. Le curseur disparaît alors, au lieu de laisser croire le contraire.
      visibleWhen: { param: 'method', oneOf: ['from', 'fromTo', 'set'] },
      control: { type: 'slider', min: -10, max: 10, step: 0.5 },
      default: 10,
    },
    {
      id: 'to',
      label: 'to',
      glossKey: 'param.to.gloss',
      group: 'group.values',
      // Symétriquement, `to` n'a de sens que si l'arrivée est déclarée.
      visibleWhen: { param: 'method', oneOf: ['to', 'fromTo', 'set'] },
      control: { type: 'slider', min: -10, max: 10, step: 0.5 },
      // Surtout pas 0 : c'est la position de repos, donc le départ implicite de la méthode
      // `to`. Le trajet aurait été nul, et un cube immobile se lit comme un plantage.
      default: -6,
    },
    {
      id: 'duration',
      label: 'duration',
      glossKey: 'param.duration.gloss',
      group: 'group.values',
      control: { type: 'slider', min: 0.1, max: 5, step: 0.1, unit: 's' },
      default: 2,
    },
    {
      id: 'ghosts',
      label: 'ghosts',
      glossKey: 'param.ghosts.gloss',
      group: 'group.values',
      control: { type: 'toggle' },
      default: true,
    },
    {
      id: 'easing',
      label: 'easing',
      glossKey: 'param.easing.gloss',
      group: 'group.curve',
      // `set` ne suit aucune courbe : ses keyframes sautent. Proposer un choix sans effet
      // serait un mensonge de plus.
      visibleWhen: { param: 'method', oneOf: ['to', 'from', 'fromTo'] },
      control: { type: 'ease' },
      default: 'ease-out',
    },
  ],

  // Un seul gabarit : le code affiché est **celui qui s'exécute**. Un onglet CSS
  // montrerait un `@keyframes` équivalent qui ne produit pas cette scène.
  code: [{ tab: 'JS', render }],

  animate,
  timing,
}

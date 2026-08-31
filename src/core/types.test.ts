import type {
  CodeLine,
  CodeTemplate,
  Family,
  Lesson,
  Param,
  ParamValues,
  SceneKind,
  TransportKind,
} from '@core/types'
import { describe, expectTypeOf, it } from 'vitest'

// Le contrat est le pivot du projet : le shell lit un `Lesson` et construit l'écran.
// Il se teste au niveau des types, pas à l'exécution — un descripteur mal formé doit
// échouer à la compilation, pas en production.

describe('contract unions', () => {
  it('enumerates the four scene kinds of spec section 4.2', () => {
    expectTypeOf<SceneKind>().toEqualTypeOf<'webgl' | 'css-cube' | 'dom-grid' | 'scroll-column'>()
  })

  it('enumerates the three transport kinds of spec section 4.3', () => {
    expectTypeOf<TransportKind>().toEqualTypeOf<'timeline' | 'scroll' | 'none'>()
  })

  it('enumerates the three lesson families', () => {
    expectTypeOf<Family>().toEqualTypeOf<'native' | 'gsap' | 'shaders'>()
  })
})

describe('Param', () => {
  it('ties a slider to a numeric default', () => {
    const duration: Param = {
      id: 'duration',
      label: 'duration',
      group: 'group.values',
      control: { type: 'slider', min: 0.1, max: 5, step: 0.1, unit: 's' },
      default: 2,
    }
    // L'union discriminée a resserré le type : ce n'est plus `ParamValue`, c'est `number`.
    expectTypeOf(duration.default).toEqualTypeOf<number>()
  })

  it('rejects a slider whose default is not a number', () => {
    // @ts-expect-error un curseur ne peut pas avoir une valeur par défaut textuelle
    const broken: Param = {
      id: 'duration',
      label: 'duration',
      group: 'group.values',
      control: { type: 'slider', min: 0.1, max: 5, step: 0.1 },
      default: 'two',
    }
    expectTypeOf(broken).toExtend<Param>()
  })

  it('rejects a toggle whose default is not a boolean', () => {
    // @ts-expect-error une bascule ne peut pas avoir une valeur par défaut numérique
    const broken: Param = {
      id: 'ghosts',
      label: 'ghosts',
      group: 'group.values',
      control: { type: 'toggle' },
      default: 1,
    }
    expectTypeOf(broken).toExtend<Param>()
  })

  it('ties a choice to a string default and translated option labels', () => {
    const method: Param = {
      id: 'method',
      label: 'method',
      group: 'group.method',
      control: {
        type: 'choice',
        options: [
          { value: 'to', label: 'to', glossKey: 'method.to.gloss' },
          { value: 'from', label: 'from' },
        ],
      },
      default: 'to',
    }
    expectTypeOf(method.control).toExtend<{ type: 'choice' | 'slider' | 'toggle' | 'ease' }>()
  })
})

describe('I18nKey inside a descriptor', () => {
  it('rejects a hard-coded translatable string — the invariant is compiler-enforced', () => {
    const param: Param = {
      id: 'duration',
      label: 'duration',
      // @ts-expect-error une chaîne française en dur n'est pas une clé du dictionnaire
      group: 'VALEURS',
      control: { type: 'slider', min: 0.1, max: 5, step: 0.1 },
      default: 2,
    }
    expectTypeOf(param).toExtend<Param>()
  })
})

describe('Lesson', () => {
  it('describes a whole screen without a single component reference', () => {
    const lesson: Lesson = {
      id: 'native-tween',
      slug: 'tween',
      family: 'native',
      order: 2,
      titleKey: 'lesson.native-tween.title',
      scene: 'webgl',
      transport: 'timeline',
      params: [
        {
          id: 'duration',
          label: 'duration',
          group: 'group.values',
          control: { type: 'slider', min: 0.1, max: 5, step: 0.1, unit: 's' },
          default: 2,
        },
      ],
      code: [{ tab: 'JS', render: () => [{ text: 'const animation = …' }] }],
      animate: () => ({ x: 0, showGhosts: false }),
      timing: () => ({ duration: 2, easing: 'linear' }),
    }
    expectTypeOf(lesson.params).toExtend<readonly Param[]>()
    expectTypeOf(lesson.code).toExtend<readonly CodeTemplate[]>()
  })

  it('keeps the descriptor immutable — a lesson is data, not state', () => {
    expectTypeOf<Lesson['params']>().toEqualTypeOf<readonly Param[]>()
  })
})

describe('CodeTemplate', () => {
  it('derives lines from the current values, never from a literal', () => {
    const template: CodeTemplate = {
      tab: 'JS',
      render: (values: ParamValues): readonly CodeLine[] => [
        { text: `duration: ${String(values.duration)}`, paramIds: ['duration'] },
      ],
    }
    expectTypeOf(template.render).parameter(0).toEqualTypeOf<ParamValues>()
    expectTypeOf(template.render).returns.toEqualTypeOf<readonly CodeLine[]>()
  })

  it('accepts the three value kinds a control can produce', () => {
    expectTypeOf<ParamValues[string]>().toEqualTypeOf<number | string | boolean>()
  })
})

import { ControlPanel } from '@controls/ControlPanel'
import { SliderControl } from '@controls/SliderControl'
import { paramStore } from '@core/paramStore'
import type { Lesson, Param, SliderParam } from '@core/types'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Le cœur de « une leçon est une donnée, pas un composant ». Ce panneau reçoit des
// `params` et rend l'écran. Il n'y a **aucun JSX sur mesure par leçon** — l'invariant.
//
// Le test qui compte le plus est le dernier : un descripteur de forme inattendue doit
// produire un écran cohérent sans qu'on touche à ce composant. C'est la répétition
// générale du verdict du lot 2.

const params: readonly Param[] = [
  {
    id: 'method',
    label: 'method',
    group: 'group.method',
    control: {
      type: 'choice',
      options: [
        { value: 'to', label: 'to', glossKey: 'method.to.gloss' },
        { value: 'from', label: 'from', glossKey: 'method.from.gloss' },
      ],
    },
    default: 'from',
  },
  {
    id: 'from',
    label: 'from',
    glossKey: 'param.from.gloss',
    group: 'group.values',
    control: { type: 'slider', min: 0, max: 20, step: 0.5, unit: '' },
    default: 10,
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
    control: { type: 'ease' },
    default: 'ease-out',
  },
]

const lesson: Lesson = {
  id: 'native-tween',
  slug: 'tween',
  family: 'native',
  order: 2,
  titleKey: 'lesson.native-tween.title',
  scene: 'webgl',
  transport: 'timeline',
  params,
  code: [],
  animate: () => ({ x: 0, showGhosts: false }),
  timing: () => ({ duration: 2, easing: 'linear' }),
}

beforeEach(() => {
  paramStore.getState().clear()
  paramStore.getState().loadLesson(lesson)
})

describe('grouping', () => {
  it('renders one block per declared group, in order of first appearance', () => {
    render(<ControlPanel params={params} />)

    const groups = screen.getAllByTestId('control-group').map((node) => node.textContent)
    expect(groups[0]).toContain('MÉTHODE')
    expect(groups[1]).toContain('VALEURS')
    expect(groups[2]).toContain('COURBE')
  })

  it('puts every parameter of a group inside it', () => {
    render(<ControlPanel params={params} />)

    const values = screen.getAllByTestId('control-group')[1]
    expect(values).toHaveTextContent('from')
    expect(values).toHaveTextContent('duration')
    expect(values).toHaveTextContent('ghosts')
  })
})

describe('slider', () => {
  it('shows the technical label untranslated and the gloss translated', () => {
    render(<ControlPanel params={params} />)

    const control = screen.getByTestId('control-duration')
    expect(control).toHaveTextContent('duration')
    expect(control).toHaveTextContent('secondes')
  })

  it('writes into the store, and only the declared parameter', async () => {
    render(<ControlPanel params={params} />)

    fireEvent.input(screen.getByRole('slider', { name: /duration/ }), { target: { value: '3.5' } })

    expect(paramStore.getState().values.duration).toBe(3.5)
    expect(paramStore.getState().values.from).toBe(10)
  })

  it('starts from the descriptor default, not from zero', () => {
    render(<ControlPanel params={params} />)

    expect(screen.getByRole('slider', { name: /duration/ })).toHaveValue('2')
  })
})

describe('choice', () => {
  it('renders one option per declared choice, with technical labels', () => {
    render(<ControlPanel params={params} />)

    expect(screen.getByRole('radio', { name: /^to/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^from/ })).toBeInTheDocument()
  })

  it('selects the default and writes the chosen value', async () => {
    const user = userEvent.setup()
    render(<ControlPanel params={params} />)

    expect(screen.getByRole('radio', { name: /^from/ })).toBeChecked()

    await user.click(screen.getByRole('radio', { name: /^to/ }))

    expect(paramStore.getState().values.method).toBe('to')
  })
})

describe('toggle', () => {
  it('is a switch reflecting the default, and flips the stored value', async () => {
    const user = userEvent.setup()
    render(<ControlPanel params={params} />)

    const toggle = screen.getByRole('switch', { name: /ghosts/ })
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    await user.click(toggle)

    expect(paramStore.getState().values.ghosts).toBe(false)
  })
})

describe('ease', () => {
  it('draws one thumbnail per catalogue curve, from the real function', () => {
    render(<ControlPanel params={params} />)

    const curves = screen.getAllByTestId('ease-curve')
    expect(curves).toHaveLength(6)
    // Le tracé est calculé, pas écrit en dur : deux courbes différentes, deux chemins.
    expect(curves[0]?.getAttribute('d')).not.toBe(curves[3]?.getAttribute('d'))
  })

  it('stores the curve id, which is what the driver turns into a CSS easing', async () => {
    const user = userEvent.setup()
    render(<ControlPanel params={params} />)

    await user.click(screen.getByRole('radio', { name: 'ease-in-out' }))

    expect(paramStore.getState().values.easing).toBe('ease-in-out')
  })
})

describe('the architectural property', () => {
  it('re-renders neither the panel nor the slider while it moves', () => {
    // Observer le panneau ne suffit pas : un curseur abonné à sa propre valeur se re-rend
    // sans faire bouger aucun parent. Vérifié par mutation — la version qui n'observait
    // que le panneau laissait passer exactement ce défaut.
    const panelRender = vi.fn()
    const sliderRender = vi.fn()

    const duration = params[2] as SliderParam
    render(
      <>
        <ControlPanel params={params} onRender={panelRender} />
        <SliderControl param={duration} onRender={sliderRender} />
      </>,
    )

    const panelBefore = panelRender.mock.calls.length
    const sliderBefore = sliderRender.mock.calls.length
    expect(sliderBefore).toBe(1)

    const slider = screen.getAllByRole('slider', { name: /duration/ })[0] as HTMLElement
    for (let step = 1; step <= 30; step += 1) {
      fireEvent.input(slider, { target: { value: String(step / 10) } })
    }

    // Trente mouvements, aucun rendu — ni du panneau, ni du curseur lui-même.
    expect(panelRender.mock.calls.length).toBe(panelBefore)
    expect(sliderRender.mock.calls.length).toBe(sliderBefore)

    // Seul l'affichage de la valeur a suivi.
    expect(screen.getAllByTestId('value-duration')[0]).toHaveTextContent('3.0')
  })

  it('renders an unexpected descriptor shape without a single change to itself', () => {
    // Un descripteur qui n'a rien à voir avec `native-tween` : autre ordre de groupes,
    // autre jeu de contrôles, un groupe d'un seul élément. Si ce test demande un jour de
    // modifier `ControlPanel`, c'est le contrat qui est mauvais — pas ce test.
    const other: readonly Param[] = [
      {
        id: 'tiles',
        label: 'tiles',
        group: 'group.curve',
        control: { type: 'slider', min: 12, max: 200, step: 1 },
        default: 48,
      },
      {
        id: 'pinned',
        label: 'pinned',
        group: 'group.method',
        control: { type: 'toggle' },
        default: false,
      },
    ]
    paramStore.getState().loadLesson({ ...lesson, params: other })

    render(<ControlPanel params={other} />)

    const groups = screen.getAllByTestId('control-group')
    expect(groups).toHaveLength(2)
    expect(groups[0]).toContain(screen.getByRole('slider', { name: /tiles/ }))
    expect(screen.getByRole('switch', { name: /pinned/ })).toBeInTheDocument()
  })
})

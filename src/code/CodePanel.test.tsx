import { CodePanel } from '@code/CodePanel'
import { paramStore } from '@core/paramStore'
import type { CodeTemplate, Lesson } from '@core/types'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Le tiroir de code (handoff, « Interactions »). Replié sur une ligne par défaut,
// dépliable, avec la ligne du contrôle en cours de manipulation surlignée, et un bouton
// « copier » qui copie **le code avec les valeurs exactement réglées**.

const template: CodeTemplate = {
  tab: 'JS',
  render: (values) => [
    { text: 'const effect = new KeyframeEffect(null, keyframes, {' },
    { text: `  duration: ${Number(values.duration) * 1000},`, paramIds: ['duration'] },
    { text: `  easing: '${String(values.easing)}',`, paramIds: ['easing'] },
    { text: '})' },
  ],
}

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
      control: { type: 'slider', min: 0.1, max: 5, step: 0.1 },
      default: 2,
    },
    {
      id: 'easing',
      label: 'easing',
      group: 'group.curve',
      control: { type: 'ease' },
      default: 'ease-out',
    },
  ],
  code: [template],
  animate: () => ({ x: 0, showGhosts: false }),
  timing: () => ({ duration: 2, easing: 'linear' }),
}

beforeEach(() => {
  paramStore.getState().clear()
  paramStore.getState().loadLesson(lesson)
})

describe('folded and unfolded', () => {
  it('is unfolded by default — the code is half the product', () => {
    // Le replier au chargement demande un clic pour voir ce qu'on est venu voir, sur un
    // site dont la moitié du contenu *est* le code. La maquette 2b le montre déplié.
    render(<CodePanel templates={lesson.code} />)

    expect(screen.getByTestId('code-lines')).toBeInTheDocument()
    expect(screen.queryByTestId('code-folded')).toBeNull()
  })

  it('folds and unfolds again from the same control', async () => {
    const user = userEvent.setup()
    render(<CodePanel templates={lesson.code} />)

    await user.click(screen.getByRole('button', { name: 'Replier le code' }))
    expect(screen.queryByTestId('code-lines')).toBeNull()
    expect(screen.getByTestId('code-folded')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Déplier le code' }))
    expect(screen.getByTestId('code-lines')).toBeInTheDocument()
  })
})

describe('derived from the current values', () => {
  it('shows the descriptor defaults on first render', async () => {
    render(<CodePanel templates={lesson.code} />)

    expect(screen.getByTestId('code-lines')).toHaveTextContent('duration: 2000,')
    expect(screen.getByTestId('code-lines')).toHaveTextContent("easing: 'ease-out',")
  })

  it('follows a value change', async () => {
    render(<CodePanel templates={lesson.code} />)

    fireEvent.click(document.body)
    paramStore.getState().setValue('duration', 4.5)

    await waitFor(() =>
      expect(screen.getByTestId('code-lines')).toHaveTextContent('duration: 4500,'),
    )
  })
})

describe('highlighting', () => {
  it('marks the line of the parameter being adjusted, and only it', async () => {
    render(<CodePanel templates={lesson.code} />)

    paramStore.getState().setValue('duration', 3)

    await waitFor(() => {
      const highlighted = screen
        .getAllByTestId('code-line')
        .filter((line) => line.dataset.highlighted === 'true')
      expect(highlighted).toHaveLength(1)
      expect(highlighted[0]).toHaveTextContent('duration: 3000,')
    })
  })

  it('moves to another line when another control is touched', async () => {
    render(<CodePanel templates={lesson.code} />)

    paramStore.getState().setValue('duration', 3)
    paramStore.getState().setValue('easing', 'ease-in')

    await waitFor(() => {
      const highlighted = screen
        .getAllByTestId('code-line')
        .filter((line) => line.dataset.highlighted === 'true')
      expect(highlighted).toHaveLength(1)
      expect(highlighted[0]).toHaveTextContent("easing: 'ease-in',")
    })
  })

  it('highlights nothing before any control has been touched', async () => {
    render(<CodePanel templates={lesson.code} />)

    expect(
      screen.getAllByTestId('code-line').filter((line) => line.dataset.highlighted === 'true'),
    ).toHaveLength(0)
  })
})

describe('copy', () => {
  it('copies the code with the values exactly as set — not the defaults', async () => {
    // `userEvent.setup()` installe son propre presse-papier sur `navigator` ; on n'en
    // utilise pas ici, et on remplace la seule propriété qui nous intéresse plutôt que
    // l'objet `navigator` entier.
    const writeText = vi.fn(async (_text: string) => {})
    const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    render(<CodePanel templates={lesson.code} />)
    paramStore.getState().setValue('duration', 4.5)
    await waitFor(() =>
      expect(screen.getByTestId('code-lines')).toHaveTextContent('duration: 4500,'),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Copier' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    expect(writeText.mock.calls[0]?.[0]).toContain('duration: 4500,')
    expect(writeText.mock.calls[0]?.[0]).not.toContain('<')

    if (original) Object.defineProperty(navigator, 'clipboard', original)
  })
})

describe('tabs', () => {
  it('shows none when the lesson has a single template', () => {
    render(<CodePanel templates={lesson.code} />)

    expect(screen.queryByRole('tablist')).toBeNull()
  })

  it('shows one tab per template when the lesson has several', async () => {
    const user = userEvent.setup()
    const css: CodeTemplate = { tab: 'CSS', render: () => [{ text: '.cube { }' }] }

    render(<CodePanel templates={[template, css]} />)

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['JS', 'CSS'])

    await user.click(screen.getByRole('tab', { name: 'CSS' }))
    expect(screen.getByTestId('code-lines')).toHaveTextContent('.cube { }')
  })
})

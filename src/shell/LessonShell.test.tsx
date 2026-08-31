import { paramStore } from '@core/paramStore'
import type { Lesson } from '@core/types'
import { sceneStore } from '@scenes/sceneStore'
import { LessonShell } from '@shell/LessonShell'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Le gabarit commun. Il lit un `Lesson` et construit l'écran, **sans aucune connaissance
// des leçons individuelles**. Si ce fichier devait un jour changer pour accueillir une
// leçon, c'est le contrat qui serait mauvais — c'est le verdict que rendra le lot 2.

vi.mock('@react-three/fiber', () => {
  // `useThree` prend un sélecteur ; le simulacre doit donc porter un état, pas un objet
  // unique. C'est ce qui permet au canvas de publier son renderer, sa fonction de redemande
  // de rendu et sa taille comme il le fait dans un vrai navigateur.
  const fakeThreeState = {
    gl: {
      info: {
        memory: { geometries: 0, textures: 0 },
        programs: [],
        render: { frame: 0, calls: 0, triangles: 0 },
      },
    },
    invalidate: () => {},
    set: () => {},
    size: { width: 800, height: 500 },
    camera: { position: { set: () => {} }, lookAt: () => {} },
  }

  return {
    Canvas: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    useFrame: () => {},
    useThree: (selector?: (state: typeof fakeThreeState) => unknown) =>
      selector ? selector(fakeThreeState) : fakeThreeState,
  }
})

// jsdom n'implémente aucune API Web Animations : le vrai driver n'y démarre pas. On le
// substitue à la frontière, exactement comme react-three-fiber. Le vrai est exercé dans
// Chromium (`tests/e2e/waapi-driver.spec.ts`).
vi.mock('@transport/drivers/waapi', async () => {
  const { createFakeDriver } = await import('@/test/fakeDriver')
  return {
    isWaapiAvailable: () => true,
    createWaapiDriver: () => createFakeDriver(2),
    liveDriverCount: () => 0,
  }
})

const tween: Lesson = {
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
      glossKey: 'param.duration.gloss',
      group: 'group.values',
      control: { type: 'slider', min: 0.1, max: 5, step: 0.1, unit: 's' },
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
  code: [
    {
      tab: 'JS',
      render: (values) => [{ text: `duration: ${Number(values.duration) * 1000}` }],
    },
  ],
  animate: () => ({ x: 0, showGhosts: false }),
  timing: () => ({ duration: 2, easing: 'linear' }),
}

/** Un descripteur d'une autre forme : autres groupes, autres contrôles, autre transport. */
const other: Lesson = {
  id: 'native-pipeline',
  slug: 'pipeline',
  family: 'native',
  order: 1,
  titleKey: 'lesson.native-tween.title',
  scene: 'webgl',
  transport: 'none',
  params: [
    {
      id: 'tiles',
      label: 'tiles',
      group: 'group.method',
      control: { type: 'slider', min: 12, max: 200, step: 1 },
      default: 48,
    },
  ],
  code: [{ tab: 'CSS', render: () => [{ text: '.tile {}' }] }],
  animate: () => ({ x: 0, showGhosts: false }),
  timing: () => ({ duration: 2, easing: 'linear' }),
}

const renderShell = (lesson: Lesson) =>
  render(
    <MemoryRouter initialEntries={['/fr/native/tween']}>
      <LessonShell lesson={lesson} />
    </MemoryRouter>,
  )

beforeEach(() => {
  paramStore.getState().clear()
  sceneStore.getState().clearScene()
})

afterEach(() => {
  paramStore.getState().clear()
  sceneStore.getState().clearScene()
})

describe('built from the descriptor alone', () => {
  it('shows the translated lesson title', () => {
    renderShell(tween)

    expect(screen.getByRole('heading', { name: "Anatomie d'un tween" })).toBeInTheDocument()
  })

  it('seeds the parameter store from the descriptor defaults', () => {
    renderShell(tween)

    expect(paramStore.getState().lessonId).toBe('native-tween')
    expect(paramStore.getState().values).toEqual({ duration: 2, easing: 'ease-out' })
  })

  it('declares its scene so the persistent canvas knows to exist', () => {
    renderShell(tween)

    expect(sceneStore.getState().kind).toBe('webgl')
    expect(sceneStore.getState().lessonId).toBe('native-tween')
  })

  it('renders one control per declared parameter, and no other', () => {
    renderShell(tween)

    expect(screen.getByRole('slider', { name: 'duration' })).toBeInTheDocument()
    expect(screen.getAllByTestId('control-group')).toHaveLength(2)
  })

  it('renders the code panel from the declared templates', () => {
    renderShell(tween)

    expect(screen.getByTestId('code-lines')).toHaveTextContent('duration: 2000')
  })

  it('gives the scene a short text description for screen readers', () => {
    renderShell(tween)

    expect(screen.getByTestId('scene-description')).toHaveTextContent(/cube isométrique/i)
  })
})

describe('transport variants', () => {
  it('shows the timeline transport when the descriptor asks for it', () => {
    renderShell(tween)

    expect(screen.getByTestId('transport')).toBeInTheDocument()
  })

  it('shows no transport at all when the descriptor says none', () => {
    // « La barre disparaît, la scène récupère l'espace » (spec §4.3).
    renderShell(other)

    expect(screen.queryByTestId('transport')).toBeNull()
  })
})

describe('an unexpected descriptor', () => {
  it('renders a lesson it has never heard of, without a single change to itself', () => {
    renderShell(other)

    expect(screen.getByRole('slider', { name: 'tiles' })).toBeInTheDocument()
    expect(screen.getByTestId('code-lines')).toHaveTextContent('.tile {}')
    expect(paramStore.getState().values).toEqual({ tiles: 48 })
  })
})

describe('leaving the lesson', () => {
  it('releases the scene and the parameter values', () => {
    const { unmount } = renderShell(tween)

    unmount()

    expect(sceneStore.getState().kind).toBeNull()
    expect(paramStore.getState().lessonId).toBeNull()
  })
})

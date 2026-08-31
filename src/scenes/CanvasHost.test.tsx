import { render } from '@testing-library/react'
import { act, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// jsdom n'a pas de WebGL : un vrai `<Canvas>` react-three-fiber n'y monte pas. On simule
// donc le module pour compter les montages — ce qu'on veut prouver ici n'est pas que
// three.js dessine, c'est que **le canvas ne se remonte jamais entre deux leçons**.
//
// Remonter un contexte WebGL à chaque navigation provoque des à-coups et, à terme,
// l'épuisement des contextes disponibles (spec §2, piège n°3). C'est le genre de défaut
// qui ne se voit qu'au bout de vingt navigations, donc jamais en relecture.

const mounts = { count: 0 }

// Fabrique asynchrone : `vi.mock` est hissé au-dessus des imports du fichier, donc React
// s'importe ici plutôt qu'en tête — sinon la liaison n'est pas encore initialisée.
vi.mock('@react-three/fiber', async () => {
  const { useEffect } = await import('react')

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
    Canvas: ({ children }: { children?: ReactNode }) => {
      useEffect(() => {
        mounts.count += 1
      }, [])
      return <div data-testid="canvas">{children}</div>
    },
    useFrame: () => {},
    useThree: (selector?: (state: typeof fakeThreeState) => unknown) =>
      selector ? selector(fakeThreeState) : fakeThreeState,
  }
})

const { CanvasHost } = await import('@scenes/CanvasHost')
const { sceneStore } = await import('@scenes/sceneStore')
const { createFakeDriver } = await import('@/test/fakeDriver')

const BOX = { left: 10, top: 20, width: 800, height: 500 }
const noAnimation = () => ({ x: 0, showGhosts: false })

/** Une scène complète : le canvas n'existe que si tout est là — leçon, driver, rectangle. */
const activate = (lessonId: string) => {
  sceneStore.getState().setScene('webgl', lessonId, createFakeDriver(), noAnimation)
  sceneStore.getState().setBox(BOX)
}

beforeEach(() => {
  mounts.count = 0
  sceneStore.getState().clearScene()
})

afterEach(() => {
  sceneStore.getState().clearScene()
})

describe('the single persistent canvas', () => {
  it('does not exist without a box to sit on — a scene with nowhere to draw is a bug', () => {
    sceneStore.getState().setScene('webgl', 'native-tween', createFakeDriver(), noAnimation)
    const { queryByTestId } = render(<CanvasHost />)

    expect(queryByTestId('canvas')).toBeNull()
  })

  it('does not exist while no WebGL scene is active — the home page costs nothing', () => {
    const { queryByTestId } = render(<CanvasHost />)

    expect(queryByTestId('canvas')).toBeNull()
    expect(mounts.count).toBe(0)
  })

  it('mounts once when a WebGL lesson becomes active', () => {
    const { queryByTestId } = render(<CanvasHost />)

    act(() => {
      activate('native-tween')
    })

    expect(queryByTestId('canvas')).not.toBeNull()
    expect(mounts.count).toBe(1)
  })

  it('survives a change of lesson — the content changes, the canvas does not', () => {
    render(<CanvasHost />)

    act(() => {
      activate('native-tween')
    })
    act(() => {
      activate('native-easing')
    })
    act(() => {
      activate('native-waapi')
    })

    // Trois leçons, un seul montage. C'est tout l'invariant.
    expect(mounts.count).toBe(1)
  })

  it('keeps the very same DOM node across a change of lesson', () => {
    const { getByTestId } = render(<CanvasHost />)

    act(() => {
      activate('native-tween')
    })
    const first = getByTestId('canvas')

    act(() => {
      activate('native-easing')
    })

    expect(getByTestId('canvas')).toBe(first)
  })

  it('releases the canvas when leaving for a non-WebGL screen', () => {
    const { queryByTestId } = render(<CanvasHost />)

    act(() => {
      activate('native-tween')
    })
    act(() => {
      sceneStore.getState().clearScene()
    })

    expect(queryByTestId('canvas')).toBeNull()
  })
})

import {
  clearRegistry,
  FAMILY_SIZES,
  findLesson,
  globalIndex,
  loadFamily,
  registerFamily,
  TOTAL_LESSONS,
} from '@core/lessonRegistry'
import type { Family, Lesson } from '@core/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Le registre fait deux choses et rien d'autre : il associe une route à une leçon, et il
// charge les descripteurs **par famille**, pas tous d'un coup. Le découpage par famille
// n'est pas cosmétique : c'est ce qui tient Three.js et les dépendances lourdes hors du
// chunk de la route initiale (spec §6).

const lesson = (family: Family, slug: string, order: number): Lesson => ({
  id: `${family}-${slug}`,
  slug,
  family,
  order,
  titleKey: 'lesson.native-tween.title',
  scene: 'webgl',
  transport: 'timeline',
  params: [],
  code: [],
  animate: () => ({ x: 0, showGhosts: false }),
  timing: () => ({ duration: 2, easing: 'linear' }),
})

describe('lesson registry', () => {
  beforeEach(() => {
    clearRegistry()
  })

  it('knows the catalogue size without loading a single descriptor', () => {
    expect(TOTAL_LESSONS).toBe(25)
    expect(FAMILY_SIZES).toEqual({ native: 10, gsap: 10, shaders: 5 })
  })

  it('numbers a lesson across the whole catalogue, not within its family', () => {
    // C'est ce que montrent les maquettes : `16 / 25` sur GSAP.06 — les dix leçons du
    // socle natif, puis six.
    expect(globalIndex(lesson('native', 'tween', 2))).toBe(2)
    expect(globalIndex(lesson('gsap', 'scroll-trigger', 6))).toBe(16)
    expect(globalIndex(lesson('shaders', 'noise', 4))).toBe(24)
  })

  it('returns a family in declared order, whatever the order of the source array', () => {
    registerFamily('native', async () => [
      lesson('native', 'easing', 3),
      lesson('native', 'tween', 2),
      lesson('native', 'pipeline', 1),
    ])

    return expect(loadFamily('native')).resolves.toEqual([
      expect.objectContaining({ slug: 'pipeline', order: 1 }),
      expect.objectContaining({ slug: 'tween', order: 2 }),
      expect.objectContaining({ slug: 'easing', order: 3 }),
    ])
  })

  it('resolves a route to its lesson', async () => {
    registerFamily('native', async () => [lesson('native', 'tween', 2)])

    await expect(findLesson('native', 'tween')).resolves.toMatchObject({ id: 'native-tween' })
  })

  it('returns undefined for an unknown slug rather than throwing', async () => {
    registerFamily('native', async () => [lesson('native', 'tween', 2)])

    await expect(findLesson('native', 'nope')).resolves.toBeUndefined()
  })

  it('returns undefined for a family nobody registered', async () => {
    await expect(findLesson('shaders', 'noise')).resolves.toBeUndefined()
    await expect(loadFamily('shaders')).resolves.toEqual([])
  })

  it('loads a family once and reuses it — a second visit costs nothing', async () => {
    const loader = vi.fn(async () => [lesson('native', 'tween', 2)])
    registerFamily('native', loader)

    await loadFamily('native')
    await loadFamily('native')
    await findLesson('native', 'tween')

    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('loads only the family being asked for', async () => {
    const nativeLoader = vi.fn(async () => [lesson('native', 'tween', 2)])
    const gsapLoader = vi.fn(async () => [lesson('gsap', 'timeline', 2)])
    registerFamily('native', nativeLoader)
    registerFamily('gsap', gsapLoader)

    await loadFamily('native')

    expect(nativeLoader).toHaveBeenCalledTimes(1)
    expect(gsapLoader).not.toHaveBeenCalled()
  })

  it('rejects two lessons sharing a slug — one URL cannot mean two lessons', async () => {
    registerFamily('native', async () => [
      lesson('native', 'tween', 2),
      lesson('native', 'tween', 5),
    ])

    await expect(loadFamily('native')).rejects.toThrow(/duplicate slug .*tween.*native/i)
  })
})

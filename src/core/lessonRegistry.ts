import type { Family, Lesson } from '@core/types'

// Le registre associe une route à une leçon et charge les descripteurs **par famille**.
//
// Le découpage par famille n'est pas cosmétique : la navigation n'affiche jamais que les
// leçons de la famille active (maquette 2f), donc rien n'oblige à charger les 25
// descripteurs. Chaque famille est un import dynamique, ce que Vite traduit en un chunk
// par famille — c'est ce qui tient Three.js et GSAP hors de la route initiale (spec §6).

/**
 * Taille de chaque famille. Données produit (« 10 + 10 + 5 »), pas des totaux dérivés : le
 * compteur du chrome doit être juste avant même que la moindre famille soit chargée.
 */
export const FAMILY_SIZES: Readonly<Record<Family, number>> = {
  native: 10,
  gsap: 10,
  shaders: 5,
}

/** Ordre d'affichage des familles, et base du numéro global d'une leçon. */
export const FAMILY_ORDER: readonly Family[] = ['native', 'gsap', 'shaders']

export const TOTAL_LESSONS = FAMILY_ORDER.reduce((sum, family) => sum + FAMILY_SIZES[family], 0)

/**
 * Numéro de la leçon dans le catalogue entier — ce qu'affiche le compteur `n / 25`.
 * `native.02` vaut 2, `gsap.06` vaut 16 : les dix leçons du socle, puis six.
 */
export const globalIndex = (lesson: Lesson): number => {
  const base = FAMILY_ORDER.slice(0, FAMILY_ORDER.indexOf(lesson.family)).reduce(
    (sum, family) => sum + FAMILY_SIZES[family],
    0,
  )
  return base + lesson.order
}

export type FamilyLoader = () => Promise<readonly Lesson[]>

const loaders = new Map<Family, FamilyLoader>()
const loaded = new Map<Family, Promise<readonly Lesson[]>>()

export const registerFamily = (family: Family, loader: FamilyLoader): void => {
  loaders.set(family, loader)
  loaded.delete(family)
}

/** Remet le registre à zéro. Sert aux tests ; l'application enregistre une fois. */
export const clearRegistry = (): void => {
  loaders.clear()
  loaded.clear()
}

const assertUniqueSlugs = (family: Family, lessons: readonly Lesson[]): void => {
  const seen = new Set<string>()
  for (const lesson of lessons) {
    if (seen.has(lesson.slug)) {
      // Deux leçons au même slug, c'est une URL qui désigne deux écrans. Mieux vaut
      // l'apprendre au chargement de la famille qu'au partage d'un lien.
      throw new Error(`Duplicate slug "${lesson.slug}" in family "${family}"`)
    }
    seen.add(lesson.slug)
  }
}

const byOrder = (a: Lesson, b: Lesson): number => a.order - b.order

/**
 * Charge une famille, une seule fois. Une famille inconnue rend une liste vide plutôt que
 * de lever : une URL erronée est un cas d'usage, pas un défaut de programmation.
 */
export const loadFamily = (family: Family): Promise<readonly Lesson[]> => {
  const cached = loaded.get(family)
  if (cached) return cached

  const loader = loaders.get(family)
  if (!loader) return Promise.resolve([])

  const pending = loader().then((lessons) => {
    assertUniqueSlugs(family, lessons)
    return [...lessons].sort(byOrder)
  })
  loaded.set(family, pending)
  return pending
}

/** Résolution route → leçon. `undefined` si la famille ou le slug n'existe pas. */
export const findLesson = async (family: Family, slug: string): Promise<Lesson | undefined> => {
  const lessons = await loadFamily(family)
  return lessons.find((lesson) => lesson.slug === slug)
}

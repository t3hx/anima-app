import type { Lesson } from '@core/types'
import { tween } from '@lessons/native/tween/lesson'

// Les leçons du socle natif. Dix à terme ; une au lot 1.
// Ajouter une leçon, c'est ajouter un dossier et une ligne ici — rien d'autre.

export const lessons: readonly Lesson[] = [tween]

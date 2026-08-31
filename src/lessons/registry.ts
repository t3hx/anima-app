import { registerFamily } from '@core/lessonRegistry'

// Le seul endroit qui connaît les familles. Chaque `import()` devient un chunk Vite, donc
// une famille non visitée n'est jamais téléchargée — c'est ce qui tient Three.js et les
// dépendances lourdes hors de la route initiale (spec §6).

export const registerLessonFamilies = (): void => {
  registerFamily('native', async () => (await import('@lessons/native')).lessons)
}

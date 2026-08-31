import { expect, test } from '@playwright/test'

// Scénario de fumée : la chaîne bout en bout tourne contre un vrai navigateur et un vrai
// build. Le routage a son propre fichier (`routing.spec.ts`) ; le scénario de la leçon,
// couvrant les points 5 et 7 du « terminé », arrive en T020.
test('serves the built application', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Anima Lab' })).toBeVisible()
})

test('leaves no console error on the initial route', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Anima Lab' })).toBeVisible()

  expect(errors).toEqual([])
})

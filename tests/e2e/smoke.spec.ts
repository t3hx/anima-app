import { expect, test } from '@playwright/test'

// Scénario de fumée du lot 0 : il prouve que la chaîne bout en bout tourne
// contre un vrai navigateur et un vrai build. Les scénarios par leçon,
// couvrant les points 5 et 7 du « terminé », arrivent au lot 1.
test('serves the built application', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Anima Lab' })).toBeVisible()
})

test('sets the document language', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
})

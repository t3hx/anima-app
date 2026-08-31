import { expect, test } from '@playwright/test'

// Le partage d'URL est une fonctionnalité, pas un détail (spec §4.7). Ces scénarios
// tournent contre le build de production servi par `vite preview` : ils vérifient ce que
// jsdom ne peut pas voir — qu'un accès **direct** à une URL profonde fonctionne, ce qui
// dépend du repli SPA du serveur autant que du routeur.

test('redirects the bare root to the default locale', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/fr$/)
  await expect(page.getByRole('heading', { name: 'Anima Lab' })).toBeVisible()
})

test('sets the document language from the locale prefix', async ({ page }) => {
  await page.goto('/fr')
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')

  await page.goto('/en')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test('serves a deep lesson URL entered directly in the address bar', async ({ page }) => {
  // C'est précisément ce que casse une configuration serveur sans `try_files` (spec §8).
  const response = await page.goto('/fr/native/tween')
  expect(response?.status()).toBe(200)
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
})

test('rewrites an unknown locale to French, keeping the rest of the path', async ({ page }) => {
  await page.goto('/de/native/tween')
  await expect(page).toHaveURL(/\/fr\/native\/tween$/)
})

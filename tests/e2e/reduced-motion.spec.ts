import { expect, test } from '@playwright/test'

// L'interrupteur `motion réduit` du chrome ne faisait rien : la préférence n'était lue
// qu'à la création du driver. Le contrôle précédent partait d'un contexte navigateur déjà
// en `reducedMotion: reduce`, donc il ne pouvait pas voir ça — il vérifiait l'état initial,
// jamais la bascule.

const readSeconds = async (page: import('@playwright/test').Page): Promise<number> => {
  const text = (await page.getByTestId('transport-time').textContent()) ?? ''
  return Number.parseFloat(text.split(' / ')[0] ?? '0')
}

test('the chrome switch stops playback while the lesson is running', async ({ page }) => {
  await page.goto('/fr/native/tween')
  await page.waitForFunction(() => (window.__anima?.webgl() ?? null) !== null)
  await page.waitForTimeout(400)

  await page.getByRole('switch', { name: /motion réduit/i }).click()
  await page.waitForTimeout(150)

  const frozen = await readSeconds(page)
  await page.waitForTimeout(400)

  expect(await readSeconds(page), 'the switch did not stop playback').toBeCloseTo(frozen, 2)
})

test('and starts it again when switched back', async ({ page }) => {
  await page.goto('/fr/native/tween')
  await page.waitForFunction(() => (window.__anima?.webgl() ?? null) !== null)
  await page.waitForTimeout(400)

  const toggle = page.getByRole('switch', { name: /motion réduit/i })
  await toggle.click()
  await page.waitForTimeout(200)
  const frozen = await readSeconds(page)

  await toggle.click()
  await page.waitForTimeout(400)

  expect(await readSeconds(page), 'the switch did not resume playback').not.toBeCloseTo(frozen, 2)
})

test('the demo stays scrubbable while reduced motion is on', async ({ page }) => {
  // Point 6 du « terminé » : les démos **ne disparaissent pas**, elles passent en lecture
  // manuelle.
  await page.goto('/fr/native/tween')
  await page.waitForFunction(() => (window.__anima?.webgl() ?? null) !== null)
  await page.getByRole('switch', { name: /motion réduit/i }).click()
  await page.waitForTimeout(200)

  const before = await page.evaluate(() => window.__anima?.webgl()?.frames ?? 0)
  await page.getByRole('slider', { name: 'Progression' }).evaluate((node: HTMLInputElement) => {
    node.value = '70'
    node.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await page.waitForTimeout(250)

  expect(await page.evaluate(() => window.__anima?.webgl()?.frames ?? 0)).toBeGreaterThan(before)
  await expect(page.locator('canvas')).toHaveCount(1)
})

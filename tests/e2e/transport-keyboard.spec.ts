import { expect, test } from '@playwright/test'

// **Ces contrôles existent parce que deux fonctionnalités déclarées « vérifiées » ne
// marchaient pas du tout.**
//
// Le clavier du transport était testé en donnant d'abord le focus au bouton de lecture,
// puis en observant que son libellé changeait. Les deux moitiés étaient fausses :
// personne n'arrive sur une page en ayant tabulé jusqu'au bon bouton, et le libellé
// venait d'un état React qui ne suivait jamais le driver — une animation qui se terminait
// laissait « Pause » affiché indéfiniment.
//
// La leçon : ne pas asserter sur l'étiquette d'un bouton, mais sur **le temps qui avance
// ou non**. C'est ce que l'utilisateur observe.

const readSeconds = async (page: import('@playwright/test').Page): Promise<number> => {
  const text = (await page.getByTestId('transport-time').textContent()) ?? ''
  return Number.parseFloat(text.split(' / ')[0] ?? '0')
}

test.beforeEach(async ({ page }) => {
  await page.goto('/fr/native/tween')
  await page.waitForFunction(() => (window.__anima?.webgl() ?? null) !== null)
  await page.waitForTimeout(400)
})

test('space pauses and resumes without having to focus anything first', async ({ page }) => {
  await page.locator('body').click({ position: { x: 5, y: 5 } })

  await page.keyboard.press('Space')
  await page.waitForTimeout(120)
  const frozen = await readSeconds(page)
  await page.waitForTimeout(350)

  expect(await readSeconds(page), 'space did not pause playback').toBeCloseTo(frozen, 2)

  await page.keyboard.press('Space')
  await page.waitForTimeout(350)

  expect(await readSeconds(page), 'space did not resume playback').not.toBeCloseTo(frozen, 2)
})

test('arrow keys scrub, and they scrub both ways', async ({ page }) => {
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('Space')
  await page.waitForTimeout(120)

  const start = await readSeconds(page)
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(120)
  const forward = await readSeconds(page)

  expect(forward, 'arrow right did not scrub forward').toBeGreaterThan(start)

  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(120)

  expect(await readSeconds(page), 'arrow left did not scrub back').toBeLessThan(forward)
})

test('the play button tells the truth about what the driver is doing', async ({ page }) => {
  // L'état de lecture appartient au driver. Si React en garde une copie qui dérive, le
  // bouton ment — et la première pression sur Espace semble sans effet.
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()

  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('Space')

  await expect(page.getByRole('button', { name: 'Lecture' })).toBeVisible()
})

test('the demo loops — it does not stop after one pass', async ({ page }) => {
  // Sans boucle, la démonstration s'arrête au bout de deux secondes et tout ce qui suit —
  // régler un curseur, observer le mode mouvement réduit — devient inobservable.
  await page.waitForTimeout(2400)

  const stats = await page.evaluate(() => window.__anima?.webgl())
  const first = await readSeconds(page)
  await page.waitForTimeout(300)

  expect(stats?.frames ?? 0).toBeGreaterThan(0)
  expect(await readSeconds(page), 'playback stopped after one pass').not.toBeCloseTo(first, 2)
})

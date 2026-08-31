import { expect, test } from '@playwright/test'
import { decode, sampleScene } from './pixels'

// **Ce fichier existe à cause d'un défaut livré.**
//
// La suite était entièrement verte — 178 tests unitaires, 23 scénarios de bout en bout, le
// canvas monté, sept géométries, trois programmes compilés, le transport qui avançait —
// et l'écran était vide. Tout était vérifié sauf la seule chose qui compte pour un site
// dont le contenu *est* une démonstration visuelle : que le sujet soit dans le champ.
//
// Une leçon dont on ne voit rien n'est pas une leçon. Ces contrôles sont donc à exécuter
// pour chaque scène du site, pas seulement pour celle-ci.

const LESSON = '/fr/native/tween'

test.beforeEach(async ({ page }) => {
  await page.goto(LESSON)
  await page.waitForFunction(() => (window.__anima?.webgl() ?? null) !== null)
  // Laisse la boucle de rendu démarrer.
  await page.waitForTimeout(300)
})

test('the renderer actually draws — frames are produced, not merely requested', async ({
  page,
}) => {
  const stats = await page.evaluate(() => window.__anima?.webgl())

  expect(stats?.frames ?? 0).toBeGreaterThan(0)
  expect(stats?.calls ?? 0).toBeGreaterThan(0)
  expect(stats?.triangles ?? 0).toBeGreaterThan(0)
})

test('the cube is inside the camera frustum — on screen, not merely rendered', async ({ page }) => {
  const subject = await page.evaluate(() => window.__anima?.subject())

  expect(subject, 'no subject registered').not.toBeNull()
  expect(Math.abs(subject?.x ?? 99), 'the cube is off screen horizontally').toBeLessThan(1)
  expect(Math.abs(subject?.y ?? 99), 'the cube is off screen vertically').toBeLessThan(1)
  expect(
    Math.abs(subject?.z ?? 99),
    'the cube is behind the camera or past the far plane',
  ).toBeLessThan(1)
})

test('the cube stays on screen across the whole travel', async ({ page }) => {
  // Le curseur `from` va de -10 à 10 : les deux extrêmes doivent rester cadrés, sinon le
  // réglage sort la démonstration de l'écran. La plage est calée sur les repères chiffrés
  // de la scène, et le cadrage de la caméra est calé sur elle — les trois vont ensemble.
  for (const value of ['-10', '0', '10']) {
    await page.getByRole('slider', { name: 'from' }).evaluate((node: HTMLInputElement, v) => {
      node.value = v
      node.dispatchEvent(new Event('input', { bubbles: true }))
    }, value)
    await page.waitForTimeout(150)

    const subject = await page.evaluate(() => window.__anima?.subject())
    expect(Math.abs(subject?.x ?? 99), `from=${value} pushes the cube off screen`).toBeLessThan(1)
    expect(Math.abs(subject?.y ?? 99), `from=${value} pushes the cube off screen`).toBeLessThan(1)
  }
})

test('a scrub while paused repaints the scene', async ({ page }) => {
  // `frameloop="demand"` ne redessine que sur demande. Si rien ne la déclenche au scrub,
  // la scène reste figée pendant que la barre de transport, elle, avance : le pire des
  // symptômes, parce que l'interface a l'air de fonctionner.
  await page.getByRole('button', { name: 'Pause' }).click()
  await page.waitForTimeout(200)

  const before = await page.evaluate(() => window.__anima?.webgl()?.frames ?? 0)
  const scrub = page.getByRole('slider', { name: 'Progression' })
  await scrub.evaluate((node: HTMLInputElement) => {
    node.value = '70'
    node.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await page.waitForTimeout(250)

  const after = await page.evaluate(() => window.__anima?.webgl()?.frames ?? 0)
  expect(after).toBeGreaterThan(before)
})

test('an idle paused scene stops rendering — demand mode is not decorative', async ({ page }) => {
  await page.getByRole('button', { name: 'Pause' }).click()
  await page.waitForTimeout(400)

  const first = await page.evaluate(() => window.__anima?.webgl()?.frames ?? 0)
  await page.waitForTimeout(600)
  const second = await page.evaluate(() => window.__anima?.webgl()?.frames ?? 0)

  // Quelques images de battement sont tolérées ; une boucle continue en produirait ~36.
  expect(second - first).toBeLessThan(5)
})

test('something is actually painted in the scene box — read from the pixels', async ({ page }) => {
  // Le contrôle qui manquait. Tous les autres passent par des nombres que l'application
  // rapporte sur elle-même ; celui-ci regarde ce que le navigateur a affiché, et ne peut
  // donc pas être trompé par une caméra correcte devant un aplat opaque, un `z-index`
  // malheureux, une opacité nulle ou un canvas de taille zéro.
  const scene = page.locator('.lesson__scene')
  const { accent, total } = sampleScene(await scene.screenshot())

  // Mesuré sur l'écran conforme : 0,54 % des échantillons. Le plancher est à 0,15 % —
  // largement au-dessus de zéro (scène vide) et loin sous la mesure, pour ne pas casser au
  // moindre changement de cadrage.
  expect(accent, 'the scene box shows no cube at all').toBeGreaterThan(total * 0.0015)

  // Le plafond dit autre chose : sans caméra explicite, react-three-fiber en pose une à
  // cinq unités de l'origine, et le cube emplit l'écran. Techniquement « visible », et
  // pédagogiquement inutilisable — on ne voit plus ni le trajet, ni le sol.
  expect(accent, 'the cube fills the frame — it is pressed against the lens').toBeLessThan(
    total * 0.08,
  )
})

test('the scene is framed in isometric — the floor reads as a floor', async ({ page }) => {
  // Le sol quadrillé occupe l'essentiel de la boîte quand la caméra est isométrique. Vu de
  // face, il se réduit à une ligne — techniquement rendu, et il n'apprend plus rien.
  // C'est ce contrôle, et lui seul, qui attrape la perte de la caméra explicite.
  const { gridRows, rows } = sampleScene(await page.locator('.lesson__scene').screenshot())

  expect(gridRows / rows, 'the floor grid does not span the scene').toBeGreaterThan(0.4)
})

test('the cube moves on screen when the transport is scrubbed', async ({ page }) => {
  // Un cube peint mais figé ressemble à un cube qui bouge sur une capture unique.
  const scene = page.locator('.lesson__scene')
  await page.getByRole('button', { name: 'Pause' }).click()

  const scrubTo = async (value: string) => {
    await page
      .getByRole('slider', { name: 'Progression' })
      .evaluate((node: HTMLInputElement, v) => {
        node.value = v
        node.dispatchEvent(new Event('input', { bubbles: true }))
      }, value)
    await page.waitForTimeout(250)
    return decode(await scene.screenshot())
  }

  const start = await scrubTo('0')
  const end = await scrubTo('100')

  let different = 0
  for (let y = 0; y < start.height; y += 4) {
    for (let x = 0; x < start.width; x += 4) {
      const a = start.at(x, y)
      const b = end.at(x, y)
      if (Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) > 30) different += 1
    }
  }

  expect(different, 'the scene looks identical at both ends of the travel').toBeGreaterThan(50)
})

import { expect, test } from '@playwright/test'

// L'alignement des deux colonnes n'était vérifié par rien, et il a cassé deux fois de
// suite : d'abord une scène centrée dans une colonne étirée pendant que le tiroir de code
// restait collé au bas du rail — des centaines de pixels de vide entre les deux — puis un
// rail qui débordait dès que le bloc COURBE était visible.
//
// Une mise en page se regarde, mais deux bords qui doivent coïncider se **mesurent**.

const rect = async (page: import('@playwright/test').Page, selector: string) =>
  page.evaluate((sel) => {
    const box = (document.querySelector(sel) as HTMLElement | null)?.getBoundingClientRect()
    return box ? { top: box.top, bottom: box.bottom, left: box.left, right: box.right } : null
  }, selector)

test.beforeEach(async ({ page }) => {
  // Une taille de bureau réaliste. Le handoff cadre son écran à 1180 de large et suppose
  // assez de hauteur pour les trois blocs de contrôles **et** le tiroir de code ; sous
  // 800 px de haut, tout ne rentre pas, et c'est le rail qui défile (test dédié plus bas).
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('/fr/native/tween')
  await page.waitForFunction(() => (window.__anima?.webgl() ?? null) !== null)
  await page.waitForTimeout(300)
})

test('the two columns start on the same line and neither one scrolls', async ({ page }) => {
  // Les **bas** ne sont plus alignés, et c'est délibéré. Les forcer obligeait l'une des
  // deux colonnes à défiler chez elle — et une barre de défilement au milieu de
  // l'interface casse le dessin. Chaque colonne prend sa hauteur ; ce qui compte, c'est
  // qu'elles partent du même trait et qu'aucune ne défile.
  const scene = await rect(page, '.lesson__scene')
  const rail = await rect(page, '.lesson__rail')

  expect(scene?.top).toBeCloseTo(rail?.top ?? -1, 0)

  const scrolls = await page.evaluate(() =>
    ['.lesson__rail', '.code-panel__lines', '.control-panel'].map((selector) => {
      const element = document.querySelector(selector) as HTMLElement | null
      return element ? element.scrollHeight - element.clientHeight : 0
    }),
  )

  expect(scrolls.every((overflow) => overflow <= 1)).toBe(true)
})

test('the canvas sits exactly on the scene box', async ({ page }) => {
  // Le canvas est positionné en `fixed` depuis le rectangle publié par le shell : s'il
  // dérive, la scène déborde sous le rail — c'est arrivé.
  const scene = await rect(page, '.lesson__scene')
  const canvas = await rect(page, 'canvas')

  expect(canvas?.left).toBeGreaterThanOrEqual((scene?.left ?? 0) - 2)
  expect(canvas?.right).toBeLessThanOrEqual((scene?.right ?? 0) + 2)
  expect(canvas?.top).toBeGreaterThanOrEqual((scene?.top ?? 0) - 2)
  expect(canvas?.bottom).toBeLessThanOrEqual((scene?.bottom ?? 0) + 2)
})

test('the scene keeps the mockup proportion, whatever the window', async ({ page }) => {
  // Le rapport 800 × 566 du handoff, soit 1,41. Il était devenu inatteignable tant que le
  // rail dictait la hauteur du bloc ; il revient dès que la scène la dicte et que les deux
  // colonnes sont indépendantes.
  for (const size of [
    { width: 1900, height: 1200 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(size)
    await page.waitForTimeout(300)

    const scene = await rect(page, '.lesson__scene')
    const width = (scene?.right ?? 0) - (scene?.left ?? 0)
    const height = (scene?.bottom ?? 0) - (scene?.top ?? 0)

    expect(width / height).toBeCloseTo(1.41, 1)
  }
})

test('a parameter that means nothing for the current method is not shown', async ({ page }) => {
  // `from` n'a pas de sens quand la méthode déclare l'arrivée, et réciproquement. Les
  // afficher tous les deux laissait croire que les quatre méthodes lisent les deux
  // valeurs — l'inverse exact de ce que la leçon enseigne.
  await expect(page.getByRole('slider', { name: 'from' })).toBeVisible()
  await expect(page.getByRole('slider', { name: 'to' })).toBeHidden()

  await page.locator('label.control__card:has(input[value="fromTo"])').click()
  await expect(page.getByRole('slider', { name: 'from' })).toBeVisible()
  await expect(page.getByRole('slider', { name: 'to' })).toBeVisible()

  await page.locator('label.control__card:has(input[value="to"])').click()
  await expect(page.getByRole('slider', { name: 'from' })).toBeHidden()
})

test('`set` follows no curve, so it offers none', async ({ page }) => {
  await expect(page.getByRole('radio', { name: 'ease-out' })).toBeVisible()

  await page.locator('label.control__card:has(input[value="set"])').click()

  await expect(page.getByRole('radio', { name: 'ease-out' })).toBeHidden()
})

test('`set` holds, jumps, and holds — with nothing in between', async ({ page }) => {
  await page.locator('label.control__card:has(input[value="set"])').click()

  // Cliquer une carte laisse le focus sur son radio, et `Espace` y est alors traité
  // nativement — donc la lecture ne se met pas en pause. C'est le bon comportement du
  // navigateur ; c'est au test d'en tenir compte.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.keyboard.press('Space')

  const readX = async () => {
    const text = (await page.getByTestId('scene-measures').textContent()) ?? ''
    return Number.parseFloat(text.replace('x ', ''))
  }

  const scrub = async (percent: string) => {
    await page
      .getByRole('slider', { name: 'Progression' })
      .evaluate((node: HTMLInputElement, v) => {
        node.value = v
        node.dispatchEvent(new Event('input', { bubbles: true }))
      }, percent)
    await page.waitForTimeout(120)
    return readX()
  }

  const start = await scrub('10')
  const justBefore = await scrub('45')
  const justAfter = await scrub('60')
  const end = await scrub('95')

  // Aucune position intermédiaire : deux états, et un saut entre les deux.
  expect(justBefore).toBeCloseTo(start, 1)
  expect(end).toBeCloseTo(justAfter, 1)
  expect(Math.abs(justAfter - justBefore)).toBeGreaterThan(5)
})

test('a short window lets the page scroll rather than an inner panel', async ({ page }) => {
  // Deux défauts mesurés ici, l'un après l'autre. Le tiroir de code s'écrasait d'abord à
  // zéro pixel et disparaissait ; puis, une fois doté d'un plancher, c'est le bloc entier
  // qui dépassait de quatre-vingt-onze pixels sous le pli — sans barre de défilement pour
  // le rattraper, la racine masquant le débordement. La barre de transport était
  // simplement hors de l'écran.
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.waitForTimeout(300)

  const code = await rect(page, '.code-panel')

  // Le tiroir montre tout son code : rien n'est écrasé.
  expect((code?.bottom ?? 0) - (code?.top ?? 0)).toBeGreaterThan(150)

  // Et si la fenêtre est trop courte, c'est la **page** qui défile — comme n'importe quelle
  // page. Aucun conteneur interne ne défile à sa place.
  const inner = await page.evaluate(() =>
    ['.lesson__rail', '.code-panel__lines', '.control-panel'].map((selector) => {
      const element = document.querySelector(selector) as HTMLElement | null
      return element ? element.scrollHeight - element.clientHeight : 0
    }),
  )

  expect(inner.every((overflow) => overflow <= 1)).toBe(true)
})

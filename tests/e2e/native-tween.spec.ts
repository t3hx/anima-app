import { expect, test } from '@playwright/test'

// Le scénario de la leçon. Il couvre ce que jsdom ne peut pas atteindre et qui se dégrade
// silencieusement à mesure que les leçons s'accumulent (génome, § Outillage qualité) :
//
//   - **point 5** du « terminé » — régler un paramètre pendant la lecture ne casse rien et
//     reprend à la même progression normalisée ;
//   - **point 7** — quitter la leçon ne laisse ni horloge vivante ni ressource WebGL
//     retenue ;
//   - la navigation clavier du transport, que jsdom ne simule pas sur un `input[range]` ;
//   - le mode mouvement réduit — point 6.

const LESSON = '/fr/native/tween'

const gotoLesson = async (page: import('@playwright/test').Page) => {
  await page.goto(LESSON)
  await expect(page.getByRole('heading', { name: "Anatomie d'un tween" })).toBeVisible()
  await page.waitForFunction(() => (window.__anima?.webgl() ?? null) !== null)
}

test('renders the whole screen from the descriptor alone', async ({ page }) => {
  await gotoLesson(page)

  // Les cinq contrôles déclarés, et rien d'autre.
  await expect(page.getByRole('radio', { name: /^to/ })).toBeVisible()
  await expect(page.getByRole('slider', { name: 'from' })).toBeVisible()
  await expect(page.getByRole('slider', { name: 'duration' })).toBeVisible()
  await expect(page.getByRole('switch', { name: 'ghosts' })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'ease-out' })).toBeVisible()

  await expect(page.getByTestId('transport')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(1)
})

test('really draws with WebGL — geometries and a program are live', async ({ page }) => {
  await gotoLesson(page)

  const info = await page.evaluate(() => window.__anima?.webgl())

  expect(info).not.toBeNull()
  expect(info?.geometries ?? 0).toBeGreaterThan(0)
})

test('point 5 — adjusting a parameter mid-play keeps the normalized progress', async ({ page }) => {
  await gotoLesson(page)

  const measured = await page.evaluate(async () => {
    const read = () => {
      const text = document.querySelector('[data-testid="transport-time"]')?.textContent ?? ''
      const [elapsed, rest] = text.split(' / ')
      return {
        elapsed: Number.parseFloat(elapsed ?? '0'),
        duration: Number.parseFloat(rest ?? '0'),
      }
    }

    // On laisse jouer, on fige, on note la progression.
    await new Promise((resolve) => setTimeout(resolve, 400))
    const pause = document.querySelector('[aria-label="Pause"]') as HTMLElement | null
    pause?.click()
    await new Promise((resolve) => setTimeout(resolve, 50))

    const before = read()
    const beforeProgress = before.elapsed / before.duration

    // On déplace la durée pendant la lecture — le cas que la spec dit de traiter
    // explicitement, pas de découvrir en test.
    const slider = document.querySelector(
      'input[type=range][aria-label="duration"]',
    ) as HTMLInputElement
    slider.value = '4.5'
    slider.dispatchEvent(new Event('input', { bubbles: true }))
    await new Promise((resolve) => setTimeout(resolve, 250))

    const after = read()
    return { beforeProgress, afterProgress: after.elapsed / after.duration, after }
  })

  // La durée a bien changé...
  expect(measured.after.duration).toBeCloseTo(4.5, 1)
  // ...et la progression normalisée est conservée.
  expect(measured.afterProgress).toBeCloseTo(measured.beforeProgress, 1)
})

test('the code shown follows the values exactly', async ({ page }) => {
  await gotoLesson(page)

  // Le tiroir est ouvert au chargement : le code est la moitié du produit.
  await expect(page.getByTestId('code-lines')).toContainText('duration: 2000,')

  const slider = page.getByRole('slider', { name: 'duration' })
  await slider.evaluate((node: HTMLInputElement) => {
    node.value = '3.4'
    node.dispatchEvent(new Event('input', { bubbles: true }))
  })

  await expect(page.getByTestId('code-lines')).toContainText('duration: 3400,')

  // Et la ligne du paramètre manipulé est celle qui est surlignée.
  const highlighted = page.locator('[data-testid="code-line"][data-highlighted="true"]')
  await expect(highlighted).toHaveCount(1)
  await expect(highlighted).toContainText('duration: 3400,')
})

test('the transport is operable from the keyboard', async ({ page }) => {
  // jsdom ne bouge pas un `input[type=range]` aux flèches : c'est ici, et seulement ici,
  // que l'exigence clavier de la spec §9 est vérifiée.
  await gotoLesson(page)

  const play = page.getByRole('button', { name: /Lecture|Pause/ })
  await play.focus()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Lecture' })).toBeVisible()

  const scrub = page.getByRole('slider', { name: 'Progression' })
  await scrub.focus()
  const before = await scrub.inputValue()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')

  expect(Number(await scrub.inputValue())).toBeGreaterThan(Number(before))
})

test('point 6 — reduced motion does not autoplay, and the demo stays scrubbable', async ({
  browser,
}) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  await gotoLesson(page)

  // La démo ne disparaît pas : elle devient manuelle.
  await expect(page.getByRole('button', { name: 'Lecture' })).toBeVisible()
  await expect(page.getByRole('slider', { name: 'Progression' })).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(1)

  await context.close()
})

test('point 7 — leaving the lesson leaves no live clock and no retained WebGL resource', async ({
  page,
}) => {
  await gotoLesson(page)

  const during = await page.evaluate(() => ({
    drivers: window.__anima?.liveDrivers() ?? -1,
    webgl: window.__anima?.webgl(),
  }))
  expect(during.drivers).toBe(1)
  expect(during.webgl?.geometries ?? 0).toBeGreaterThan(0)

  // On quitte la leçon **par une navigation côté client**. Avec `page.goto`, le
  // rechargement remet tout à zéro et le test passe même quand la leçon ne libère rien :
  // vérifié par mutation, il restait vert alors que les horloges s'accumulaient.
  await page.getByRole('link', { name: "Retour à l'accueil" }).click()
  await expect(page.getByRole('heading', { name: 'Anima Lab' })).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)

  const after = await page.evaluate(() => ({
    drivers: window.__anima?.liveDrivers() ?? -1,
    webgl: window.__anima?.webgl(),
  }))

  expect(after.drivers).toBe(0)
  expect(after.webgl).toBeNull()
})

test('going back and forth does not accumulate clocks', async ({ page }) => {
  // La fuite d'un site de 25 scènes ne se voit pas à la première navigation : elle
  // s'accumule. Cinq allers-retours suffisent à la rendre visible.
  await gotoLesson(page)

  for (let round = 0; round < 4; round += 1) {
    await page.getByRole('link', { name: 'GSAP' }).click()
    await page.goBack()
    await expect(page.getByRole('heading', { name: "Anatomie d'un tween" })).toBeVisible()
  }

  const drivers = await page.evaluate(() => window.__anima?.liveDrivers() ?? -1)
  expect(drivers).toBe(1)
})

import { expect, test } from '@playwright/test'

// jsdom n'implémente aucune API Web Animations. Ce fichier est donc **le seul endroit** où
// le driver WAAPI est réellement exercé : dans Chromium, contre le vrai module, via le
// banc d'essai `tests/e2e/harness` que Vite ne construit que pour ces tests.
//
// Sans ce fichier, `src/transport/TimeDriver.test.ts` resterait vert même si
// `createWaapiDriver` était supprimé — il ne teste que l'arithmétique du temps.

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/e2e/harness/index.html')
  await page.waitForFunction(() => window.harness !== undefined)
})

test('applies the easing itself — we compute no curve', async ({ page }) => {
  const measured = await page.evaluate(() => {
    window.harness.create({ duration: 1, easing: 'cubic-bezier(0.25, 1, 0.5, 1)', loop: false })
    const driver = window.harness.driver
    if (!driver) throw new Error('no driver')

    driver.pause()
    driver.seek(0.25)
    return { eased: driver.easedProgress, time: driver.timeProgress }
  })

  // Le temps est à 25 %, la progression après courbe est bien plus avancée.
  expect(measured.time).toBeCloseTo(0.25, 3)
  expect(measured.eased).toBeCloseTo(0.6885899, 5)
})

test('reports a linear progress under a linear easing', async ({ page }) => {
  const measured = await page.evaluate(() => {
    window.harness.create({ duration: 1, easing: 'linear', loop: false })
    const driver = window.harness.driver
    if (!driver) throw new Error('no driver')
    driver.pause()
    driver.seek(0.4)
    return { eased: driver.easedProgress, time: driver.timeProgress }
  })

  expect(measured.time).toBeCloseTo(0.4, 3)
  expect(measured.eased).toBeCloseTo(0.4, 3)
})

test('scrubs, plays, pauses and changes rate', async ({ page }) => {
  const states = await page.evaluate(async () => {
    window.harness.create({ duration: 4, easing: 'linear', loop: false })
    const driver = window.harness.driver
    if (!driver) throw new Error('no driver')

    driver.pause()
    driver.seek(0.5)
    const afterSeek = driver.timeProgress

    driver.setRate(2)
    const rate = driver.rate

    driver.play()
    const playing = driver.playing
    await new Promise((resolve) => setTimeout(resolve, 120))
    const advanced = driver.timeProgress

    driver.pause()
    const paused = driver.playing
    const held = driver.timeProgress
    await new Promise((resolve) => setTimeout(resolve, 120))

    return { afterSeek, rate, playing, advanced, paused, held, stillHeld: driver.timeProgress }
  })

  expect(states.afterSeek).toBeCloseTo(0.5, 3)
  expect(states.rate).toBe(2)
  expect(states.playing).toBe(true)
  expect(states.advanced).toBeGreaterThan(0.5)
  expect(states.paused).toBe(false)
  expect(states.stillHeld).toBeCloseTo(states.held, 5)
})

test('accepts a negative rate — the transport offers them', async ({ page }) => {
  const played = await page.evaluate(async () => {
    window.harness.create({ duration: 4, easing: 'linear', loop: false })
    const driver = window.harness.driver
    if (!driver) throw new Error('no driver')

    driver.seek(0.8)
    driver.setRate(-1)
    driver.play()
    await new Promise((resolve) => setTimeout(resolve, 150))
    return driver.timeProgress
  })

  expect(played).toBeLessThan(0.8)
})

test('keeps the normalized progress when the duration changes mid-play', async ({ page }) => {
  // Point 5 du « terminé » : régler un paramètre pendant la lecture ne casse pas la
  // lecture — l'animation est reconstruite et reprend à la même progression normalisée.
  const measured = await page.evaluate(() => {
    window.harness.create({ duration: 2, easing: 'linear', loop: false })
    const driver = window.harness.driver
    if (!driver) throw new Error('no driver')

    driver.pause()
    driver.seek(0.37)
    const before = driver.timeProgress

    driver.retime({ duration: 5 })

    return { before, after: driver.timeProgress, duration: driver.duration }
  })

  expect(measured.duration).toBe(5)
  expect(measured.after).toBeCloseTo(measured.before, 3)
  expect(measured.after).toBeCloseTo(0.37, 3)
})

test('keeps playing across a retime', async ({ page }) => {
  const stillPlaying = await page.evaluate(async () => {
    window.harness.create({ duration: 4, easing: 'linear', loop: false })
    const driver = window.harness.driver
    if (!driver) throw new Error('no driver')

    driver.play()
    await new Promise((resolve) => setTimeout(resolve, 80))
    driver.retime({ duration: 6, easing: 'ease-in' })
    await new Promise((resolve) => setTimeout(resolve, 80))
    return driver.playing
  })

  expect(stillPlaying).toBe(true)
})

test('document.getAnimations() is blind to a null-target animation', async ({ page }) => {
  // Ce test existe pour empêcher une régression de raisonnement, pas de code.
  // L'assertion « évidente » du point 7 — `document.getAnimations().length === 0` — est
  // VERTE même quand un driver joue, parce que `getAnimations()` ne rend que les
  // animations attachées à un élément du document. Nos horloges ont une cible nulle.
  // Écrire ce contrôle-là reviendrait à ne rien contrôler.
  const counts = await page.evaluate(() => {
    window.harness.create({ duration: 2, easing: 'linear', loop: false })
    window.harness.driver?.play()
    return { animations: window.harness.liveAnimations(), drivers: window.harness.liveDrivers() }
  })

  expect(counts.animations).toBe(0)
  expect(counts.drivers).toBe(1)
})

test('releases the driver on dispose — nothing survives leaving a lesson', async ({ page }) => {
  // Point 7 du « terminé ». C'est la fuite la plus facile à laisser passer : une animation
  // non annulée ne se voit pas à l'écran, elle s'accumule.
  const counts = await page.evaluate(() => {
    const before = window.harness.liveDrivers()
    window.harness.create({ duration: 2, easing: 'linear', loop: false })
    window.harness.driver?.play()
    const during = window.harness.liveDrivers()
    window.harness.driver?.dispose()
    return { before, during, after: window.harness.liveDrivers() }
  })

  expect(counts.before).toBe(0)
  expect(counts.during).toBe(1)
  expect(counts.after).toBe(0)
})

test('loops without the progress running past one', async ({ page }) => {
  const samples = await page.evaluate(async () => {
    window.harness.create({ duration: 0.2, easing: 'linear', loop: true })
    const driver = window.harness.driver
    if (!driver) throw new Error('no driver')

    driver.play()
    const seen: number[] = []
    for (let i = 0; i < 8; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 60))
      seen.push(driver.timeProgress)
    }
    driver.dispose()
    return seen
  })

  // Plusieurs tours effectués, et la progression reste normalisée à chaque instant.
  for (const sample of samples) {
    expect(sample).toBeGreaterThanOrEqual(0)
    expect(sample).toBeLessThanOrEqual(1)
  }
})

test('a looping driver keeps the end of a pass as the end, not as the start', async ({ page }) => {
  // Cas limite trouvé par un scénario de scène : à la fin exacte d'un tour, le modulo qui
  // ramène le temps dans l'itération rend 0. Un scrub à 100 % renvoyait donc la poignée au
  // début — et la scène avec elle.
  const measured = await page.evaluate(() => {
    window.harness.create({ duration: 2, easing: 'linear', loop: true })
    const driver = window.harness.driver
    if (!driver) throw new Error('no driver')

    driver.pause()
    driver.seek(1)
    const atEnd = driver.timeProgress
    driver.seek(0.5)
    const atHalf = driver.timeProgress
    driver.dispose()
    return { atEnd, atHalf }
  })

  expect(measured.atEnd).toBeCloseTo(1, 3)
  expect(measured.atHalf).toBeCloseTo(0.5, 3)
})

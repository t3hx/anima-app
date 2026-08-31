import { expect, test } from '@playwright/test'

// **Ce fichier existe parce que j'ai affirmé des choses fausses.**
//
// J'ai annoncé que le nom de la méthode sélectionnée se colorait, en me fiant à une
// capture d'écran où je croyais le voir. La règle CSS n'avait jamais été écrite : un
// script d'édition avait échoué sur une assertion **après** avoir appliqué ce
// remplacement en mémoire, si bien que le fichier n'a jamais été enregistré.
//
// Une capture ne prouve pas une couleur. Un style calculé, si. Chacune des vérifications
// ci-dessous porte sur une valeur que le navigateur rend, pas sur une impression.

const computed = async (
  page: import('@playwright/test').Page,
  selector: string,
  property: string,
) =>
  page.evaluate(
    ([sel, prop]) => {
      const element = document.querySelector(sel as string)
      return element ? getComputedStyle(element).getPropertyValue(prop as string) : null
    },
    [selector, property] as const,
  )

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('/fr/native/tween')
  await page.waitForFunction(() => (window.__anima?.webgl() ?? null) !== null)
  await page.waitForTimeout(300)
})

test('the chosen method is named in the family tint', async ({ page }) => {
  const chosen = await computed(
    page,
    'label.control__card:has(input:checked) .control__card-label',
    'color',
  )
  const other = await computed(
    page,
    'label.control__card:not(:has(input:checked)) .control__card-label',
    'color',
  )

  // `--accent-clair` de la famille `native`, soit #f0b678.
  expect(chosen).toBe('rgb(240, 182, 120)')
  expect(other).not.toBe(chosen)
})

test('a curve card carries the mockup grid, and loses it once chosen', async ({ page }) => {
  const unchosen = await computed(
    page,
    'label.control__curve:not(:has(input:checked))',
    'background-image',
  )
  const chosen = await computed(page, 'label.control__curve:has(input:checked)', 'background-image')

  expect(unchosen).toContain('linear-gradient')
  expect(chosen).toBe('none')
})

test('the chrome separates its two rows, as the mockup does', async ({ page }) => {
  // Le trait vit sur une bande pleine largeur, pas sur la rangée : celle-ci est plafonnée
  // à la largeur de référence, et son trait s'arrêtait donc au milieu de l'écran.
  expect(await computed(page, '.nav__band', 'border-bottom-width')).toBe('1px')
  expect(await computed(page, '.nav', 'border-bottom-width')).toBe('1px')
})

test('the screen starts right under the chrome, not floating in the middle', async ({ page }) => {
  const gap = await page.evaluate(() => {
    const nav = document.querySelector('.nav')?.getBoundingClientRect()
    const lesson = document.querySelector('.lesson')?.getBoundingClientRect()
    return (lesson?.top ?? 0) - (nav?.bottom ?? 0)
  })

  expect(gap).toBeLessThan(2)
})

test('the code drawer is open on arrival', async ({ page }) => {
  // Le code est la moitié du produit : le replier demande un clic pour voir ce qu'on est
  // venu voir.
  await expect(page.getByTestId('code-lines')).toBeVisible()
})

test('the open code drawer introduces no scrollbar anywhere', async ({ page }) => {
  // Le défaut que ce contrôle remplace : pour aligner les bas des deux colonnes, l'une
  // devait défiler chez elle. Une barre de défilement au milieu de l'interface casse le
  // dessin — les colonnes ont donc chacune leur hauteur, et rien ne défile.
  const overflow = await page.evaluate(() =>
    ['.lesson__rail', '.code-panel__lines', '.control-panel', '#root'].map((selector) => {
      const element = document.querySelector(selector) as HTMLElement | null
      return element ? element.scrollHeight - element.clientHeight : 0
    }),
  )

  expect(overflow.every((value) => value <= 1)).toBe(true)

  const sceneTop = await page.evaluate(
    () => document.querySelector('.lesson__scene')?.getBoundingClientRect().top,
  )
  const railTop = await page.evaluate(
    () => document.querySelector('.lesson__rail')?.getBoundingClientRect().top,
  )
  expect(sceneTop).toBeCloseTo(railTop ?? -1, 0)
})

test('the axis marks sit where the camera actually projects their value', async ({ page }) => {
  // Les repères précédents étaient posés à intervalle fixe et numérotés 0, 5, 10 : ils ne
  // mesuraient rien, et le cube parcourait l'axe dans l'autre sens. Un banc d'essai dont
  // les graduations ne correspondent à aucune grandeur ment sur ce qu'il montre.
  const marks = await page.evaluate(() =>
    [...document.querySelectorAll('.overlay__mark')].map((mark) => ({
      value: Number((mark as HTMLElement).dataset.mark),
      left: Number.parseFloat((mark as HTMLElement).style.left),
    })),
  )

  expect(marks.map((mark) => mark.value)).toEqual([-10, -5, 0, 5, 10])

  // Zéro au centre, et l'ordre des abscisses respecté sur l'écran.
  const zero = marks.find((mark) => mark.value === 0)
  expect(zero?.left).toBeCloseTo(50, 0)
  for (let index = 1; index < marks.length; index += 1) {
    expect(marks[index]?.left ?? 0).toBeGreaterThan(marks[index - 1]?.left ?? 0)
  }
})

test('the axis agrees with the measured position of the cube', async ({ page }) => {
  // La vraie preuve : la position lue dans l'encart doit tomber entre les deux repères qui
  // l'encadrent à l'écran.
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('Space')
  await page.waitForTimeout(150)

  const check = await page.evaluate(() => {
    const text = document.querySelector('[data-testid="scene-measures"]')?.textContent ?? ''
    const x = Number.parseFloat(text.replace('x ', ''))
    const subject = window.__anima?.subject()
    // `subject.x` est en coordonnées normalisées -1..1 ; on le ramène en fraction.
    return { x, screen: ((subject?.x ?? 0) + 1) / 2 }
  })

  const marks = await page.evaluate(() =>
    [...document.querySelectorAll('.overlay__mark')].map((mark) => ({
      value: Number((mark as HTMLElement).dataset.mark),
      left: Number.parseFloat((mark as HTMLElement).style.left) / 100,
    })),
  )

  const below = marks.filter((mark) => mark.value <= check.x).pop()
  const above = marks.find((mark) => mark.value >= check.x)

  expect(check.screen).toBeGreaterThanOrEqual((below?.left ?? 0) - 0.02)
  expect(check.screen).toBeLessThanOrEqual((above?.left ?? 1) + 0.02)
})

test('the `to` method actually moves the cube', async ({ page }) => {
  // Avec une destination par défaut à 0 — la position de repos — le trajet était nul et le
  // cube semblait figé. Ce qui se lit, à l'écran, comme un plantage.
  await page.locator('label.control__card:has(input[value="to"])').click()
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.waitForTimeout(500)

  const readX = async () => {
    const text = (await page.getByTestId('scene-measures').textContent()) ?? ''
    return Number.parseFloat(text.replace('x ', ''))
  }

  const first = await readX()
  await page.waitForTimeout(400)
  const second = await readX()

  expect(Math.abs(second - first)).toBeGreaterThan(0.3)
})

test('no speed selector — its absence is a decision, not an oversight', async ({ page }) => {
  // Il fonctionnait : 1,57 s parcourues à 4× contre 0,20 s à 0,5× sur le même laps, mesuré.
  // L'humain a jugé qu'il n'apportait rien à cette leçon. Ce contrôle existe pour que son
  // retour soit un choix explicite plutôt qu'une régression silencieuse.
  await expect(page.locator('.transport select')).toHaveCount(0)
})

test('the scene keeps its size when a control block disappears', async ({ page }) => {
  // `set` masque le bloc COURBE. Tant que le rail dictait la hauteur de la ligne de grille,
  // le masquer raccourcissait la scène : changer de méthode aplatissait l'écran.
  const height = async () => {
    const box = await page.evaluate(
      () => document.querySelector('.lesson__scene')?.getBoundingClientRect().height,
    )
    return Math.round(box ?? 0)
  }

  const before = await height()
  await page.locator('label.control__card:has(input[value="set"])').click()
  await page.waitForTimeout(250)

  expect(await height()).toBe(before)
})

test('the chrome separator runs the full width, like the one below it', async ({ page }) => {
  // Le trait du haut était posé sur la rangée, plafonnée à la largeur de référence : il
  // s'arrêtait au milieu de l'écran quand celui du bas allait d'un bord à l'autre.
  const widths = await page.evaluate(() => {
    const band = document.querySelector('.nav__band')?.getBoundingClientRect().width
    const nav = document.querySelector('.nav')?.getBoundingClientRect().width
    return { band, nav }
  })

  expect(widths.band).toBeCloseTo(widths.nav ?? -1, 0)
})

test('the active lesson pill is set in bold, as the mockup has it', async ({ page }) => {
  const active = await computed(page, '.nav__lesson[aria-current="page"]', 'font-weight')
  expect(active).toBe('600')
})

test('the transport controls are equal rounded squares, as the mockup draws them', async ({
  page,
}) => {
  // Elles étaient rondes et de tailles inégales — un rythme approximatif là où la maquette
  // est réglée : trois carrés de 32 px, rayon 9.
  const buttons = await page.evaluate(() =>
    [...document.querySelectorAll('.transport__button')].map((button) => {
      const style = getComputedStyle(button)
      return {
        width: style.width,
        height: style.height,
        radius: style.borderTopLeftRadius,
      }
    }),
  )

  expect(buttons).toHaveLength(3)
  for (const button of buttons) {
    expect(button.width).toBe('32px')
    expect(button.height).toBe('32px')
    expect(button.radius).toBe('9px')
  }
})

test('the transport bar has the crisp outline the mockup gives it', async ({ page }) => {
  expect(await computed(page, '.transport', 'border-top-width')).toBe('1px')
  expect(await computed(page, '.transport', 'border-top-style')).toBe('solid')
  expect(await computed(page, '.transport', 'height')).toBe('52px')
})

test('the body is allowed wider margins than the chrome', async ({ page }) => {
  // Rien n'oblige le chrome et le corps à partager leurs marges. En donnant au corps des
  // marges plus courtes, la scène gagne de la place sans que la barre de menu paraisse
  // étirée.
  const widths = await page.evaluate(() => ({
    nav: document.querySelector('.nav__row--families')?.getBoundingClientRect().width,
    body: document.querySelector('.lesson')?.getBoundingClientRect().width,
  }))

  expect(widths.body ?? 0).toBeGreaterThan(widths.nav ?? 0)
})

test('no horizontal scrollbar in the code drawer', async ({ page }) => {
  // Le gabarit de code est écrit pour tenir dans la largeur du rail. Ce contrôle vérifie
  // le résultat à l'écran — la police réelle, pas un compte de caractères — et sur les
  // quatre méthodes, puisque `set` écrit des keyframes bien plus longues.
  for (const method of ['from', 'to', 'fromTo', 'set']) {
    await page.locator(`label.control__card:has(input[value="${method}"])`).click()
    await page.waitForTimeout(150)

    const overflow = await page.evaluate(() => {
      const element = document.querySelector('[data-testid="code-lines"]') as HTMLElement | null
      return element ? element.scrollWidth - element.clientWidth : 0
    })

    expect(overflow, `method ${method} overflows the code drawer`).toBeLessThanOrEqual(1)
  }
})

test('a slider thumb is drawn above its track, not crossed by it', async ({ page }) => {
  // La piste est un pseudo-élément du conteneur, donc peinte **après** l'input : la barre
  // passait par-dessus le bouton. L'élément interactif doit être au-dessus de son décor.
  const layers = await page.evaluate(() => {
    const read = (selector: string) => {
      const element = document.querySelector(selector)
      if (!element) return null
      const style = getComputedStyle(element)
      return { zIndex: style.zIndex, position: style.position }
    }
    return { slider: read('.control__slider'), scrub: read('.transport__scrub') }
  })

  for (const layer of [layers.slider, layers.scrub]) {
    expect(layer?.position).toBe('relative')
    expect(Number(layer?.zIndex)).toBeGreaterThan(0)
  }
})

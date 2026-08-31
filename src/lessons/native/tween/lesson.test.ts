import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { generateCode, joinLines } from '@code/generate'
import { EASINGS } from '@core/easings'
import { fr } from '@i18n/fr'
import { MAX_CODE_COLUMNS, tween } from '@lessons/native/tween/lesson'
import { describe, expect, it } from 'vitest'

// La leçon est une **donnée**. Ce fichier vérifie que la donnée est complète et cohérente
// — les huit points du « terminé » (spec §11) qui se vérifient sans navigateur.
// Les points 5 et 7 (réglage pendant la lecture, libération des ressources) demandent un
// vrai navigateur : ils sont en `tests/e2e/native-tween.spec.ts`.

// Le descripteur déclare exactement un gabarit ; une assertion plutôt qu'un `!` — si
// cette hypothèse tombe un jour, le message dira laquelle.
const template = tween.code[0]
if (!template) throw new Error('native-tween declares no code template')

describe('the descriptor', () => {
  it('declares its identity and its place in the catalogue', () => {
    expect(tween.id).toBe('native-tween')
    expect(tween.slug).toBe('tween')
    expect(tween.family).toBe('native')
    expect(tween.order).toBe(2)
  })

  it('uses the WebGL scene and the timeline transport', () => {
    expect(tween.scene).toBe('webgl')
    expect(tween.transport).toBe('timeline')
  })

  it('declares a control for every value the code shows', () => {
    // `to` s'est ajouté après essai : sans lui, `fromTo` et `set` n'avaient aucune
    // destination réglable, et deux des quatre méthodes étaient donc indémontrables.
    expect(tween.params.map((param) => param.id)).toEqual([
      'method',
      'from',
      'to',
      'duration',
      'ghosts',
      'easing',
    ])
  })

  it('names every parameter with its technical label, never a translated one', () => {
    // Point 8 du « terminé » : les libellés techniques ne se traduisent pas et restent en
    // monospace. Une glose traduite les accompagne.
    for (const param of tween.params) {
      expect(param.label).toMatch(/^[a-z][a-zA-Z]*$/)
      expect(Object.values(fr)).not.toContain(param.label)
    }
  })

  it('routes every gloss through the dictionary', () => {
    for (const param of tween.params) {
      if (param.glossKey) expect(fr[param.glossKey]).toBeTruthy()
    }
  })

  it('offers the four keyframe methods of the mockup', () => {
    const method = tween.params.find((param) => param.id === 'method')
    expect(method?.control.type).toBe('choice')
    if (method?.control.type !== 'choice') throw new Error('method is not a choice')
    expect(method.control.options.map((option) => option.value)).toEqual([
      'to',
      'from',
      'fromTo',
      'set',
    ])
  })

  it('defaults to `from` — the mockup shows the object surging in from x = 10', () => {
    const method = tween.params.find((param) => param.id === 'method')
    expect(method?.default).toBe('from')
    expect(tween.params.find((param) => param.id === 'from')?.default).toBe(10)
    expect(tween.params.find((param) => param.id === 'duration')?.default).toBe(2)
  })

  it('defaults to a curve the catalogue actually offers', () => {
    const easing = tween.params.find((param) => param.id === 'easing')
    expect(EASINGS.map((curve) => curve.id)).toContain(easing?.default)
  })
})

describe('the generated code', () => {
  it('is real Web Animations code, not a GSAP call', () => {
    // Décision D1 : la leçon est du socle natif. La maquette montrait du GSAP sous une
    // étiquette NATIF — l'étiquette l'emporte.
    const text = joinLines(
      generateCode(template, { method: 'from', from: 10, duration: 2, easing: 'ease-out' }),
    )

    expect(text).toContain('KeyframeEffect')
    expect(text).not.toContain('gsap')
  })

  it('reflects the current values exactly', () => {
    const text = joinLines(
      generateCode(template, { method: 'from', from: 4, to: 0, duration: 3.5, easing: 'ease-in' }),
    )

    expect(text).toContain('x: 4')
    expect(text).toContain('duration: 3500')
    expect(text).toContain("easing: 'ease-in'")
  })

  it('shows the keyframes each method actually writes', () => {
    const keyframesFor = (method: string) =>
      joinLines(generateCode(template, { method, from: 10, to: -4, duration: 2, easing: 'linear' }))

    // L'accolade vide est la keyframe **implicite** : le navigateur la remplit avec l'état
    // courant de l'objet. C'est ce que chaque méthode déclare, ou pas.
    expect(keyframesFor('to')).toContain('[{}, { x: -4 }]')
    expect(keyframesFor('from')).toContain('[{ x: 10 }, {}]')
    expect(keyframesFor('fromTo')).toContain('[{ x: 10 }, { x: -4 }]')
  })

  it('expresses `set` with two keyframes at the same offset — a real discontinuity', () => {
    const code = joinLines(
      generateCode(template, { method: 'set', from: 10, to: -4, duration: 2, easing: 'ease-out' }),
    )

    // Deux keyframes au même offset : c'est ainsi qu'on écrit un saut en WAAPI, et le code
    // affiché doit le montrer plutôt que de le cacher derrière une courbe en escalier.
    expect(code).toContain('{ x: 10, offset: 0.5 }')
    expect(code).toContain('{ x: -4, offset: 0.5 }')
    // La durée est conservée : c'est ce qui laisse le temps de voir les deux états.
    expect(code).toContain('duration: 2000,')
  })

  it('hides the curve for `set`, which follows none', () => {
    const easing = tween.params.find((param) => param.id === 'easing')
    expect(easing?.visibleWhen?.oneOf).not.toContain('set')
  })

  it('shows `from` only when the start is declared, and `to` only when the target is', () => {
    // Sans cela, les quatre méthodes semblent lire les deux valeurs — l'inverse exact de
    // ce que la leçon enseigne.
    const rule = (id: string) => tween.params.find((param) => param.id === id)?.visibleWhen
    expect(rule('from')?.oneOf).toEqual(['from', 'fromTo', 'set'])
    expect(rule('to')?.oneOf).toEqual(['to', 'fromTo', 'set'])
  })

  it('highlights a line for every parameter that the code shows', () => {
    // Point 3 du « terminé » : la surbrillance fonctionne pour chaque paramètre.
    const lines = generateCode(template, {
      method: 'from',
      from: 10,
      duration: 2,
      easing: 'ease-out',
    })
    const highlighted = new Set(lines.flatMap((line) => line.paramIds ?? []))

    for (const id of ['method', 'from', 'duration', 'easing']) {
      expect(highlighted, `${id} highlights no line`).toContain(id)
    }
  })

  it('ships a single template — the code shown is the code that runs', () => {
    expect(tween.code).toHaveLength(1)
    expect(template?.tab).toBe('JS')
  })
})

describe('the concept text', () => {
  const concept = readFileSync(
    join(process.cwd(), 'src/lessons/native/tween/concept.fr.md'),
    'utf8',
  )

  it('is between 150 and 300 words, as the definition of done requires', () => {
    const words = concept
      .replace(/[#*`_>[\]()-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)

    expect(words.length).toBeGreaterThanOrEqual(150)
    expect(words.length).toBeLessThanOrEqual(300)
  })

  it('is written in French', () => {
    expect(concept).toMatch(/\b(le|la|les|une|des|qui|que)\b/i)
  })

  it('mentions no library the lesson does not use', () => {
    expect(concept.toLowerCase()).not.toContain('gsap')
  })
})

describe('the code fits the rail without scrolling sideways', () => {
  // Le tiroir fait 344 px de large. Un extrait qui déborde horizontalement demande de le
  // faire défiler pour le lire — et c'est pendant qu'on règle un curseur qu'on le lit,
  // donc au pire moment. La contrainte est donc **écrite dans le gabarit**, pas laissée à
  // une barre de défilement.
  //
  // Le contrôle balaie toutes les combinaisons, pas seulement l'affichage par défaut :
  // c'est une valeur extrême — une courbe à dépassement, deux positions négatives — qui
  // faisait déborder la ligne.
  const template = tween.code[0]
  if (!template) throw new Error('native-tween declares no code template')

  const methods = ['to', 'from', 'fromTo', 'set']
  const positions = [-10, -0.5, 10]
  const durations = [0.1, 2, 5]

  it(`keeps every line within ${MAX_CODE_COLUMNS} columns, whatever the settings`, () => {
    const offenders: string[] = []

    for (const method of methods) {
      for (const from of positions) {
        for (const to of positions) {
          for (const duration of durations) {
            for (const easing of EASINGS) {
              const values = { method, from, to, duration, easing: easing.id }
              for (const line of generateCode(template, values)) {
                if (line.text.length > MAX_CODE_COLUMNS) {
                  offenders.push(`${line.text.length} cols · ${method}/${easing.id} · ${line.text}`)
                }
              }
            }
          }
        }
      }
    }

    expect(offenders.slice(0, 5)).toEqual([])
  })
})

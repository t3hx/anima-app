import { requestRedraw } from '@core/redraw'
import { useTranslation } from '@i18n/localeStore'
import type { TimeDriver } from '@transport/TimeDriver'
import { useCallback, useEffect, useRef, useState } from 'react'

import './TransportBar.css'

// Variante `timeline` du transport (spec §4.3). Trois variantes partageront cet
// emplacement et cette hauteur ; `scroll` et `none` arrivent aux lots 3 et 4.
//
// **Écart assumé à la spec §4.3** : pas de sélecteur de vitesse. Il fonctionnait — mesuré,
// 1,57 s parcourues à 4× contre 0,20 s à 0,5× sur le même laps — mais l'humain a jugé
// qu'il n'apportait rien à cette leçon et a demandé son retrait. Le `setRate` du driver
// reste, il sera utile aux leçons où la vitesse *est* le sujet.
//
// Règle qui gouverne tout le composant : **le scrub agit sur le driver, jamais sur l'état
// React**. La position de la poignée et le temps affiché sont écrits directement dans le
// DOM depuis une boucle `requestAnimationFrame` ; React ne re-rend que sur les événements
// discrets — lecture, boucle, vitesse. Sans cela, la barre re-rendrait soixante fois par
// seconde, exactement le piège n°2 de la spec §2.

const SCRUB_STEPS = 100

const formatSeconds = (seconds: number): string => seconds.toFixed(2)

export function TransportBar({ driver }: { driver: TimeDriver }) {
  const t = useTranslation()
  const [playing, setPlaying] = useState(driver.playing)
  const [looping, setLooping] = useState(driver.looping)

  const scrubRef = useRef<HTMLInputElement>(null)
  const painted = useRef(-1)
  const timeRef = useRef<HTMLSpanElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  /** Écrit la position courante dans le DOM, sans passer par un rendu. */
  const paint = useCallback(() => {
    const progress = driver.timeProgress

    // Le transport est le seul à savoir que le temps a bougé — lecture, scrub ou saut. Il
    // réveille donc la scène, et **seulement quand la progression a changé** : redemander
    // un rendu à chaque frame annulerait tout l'intérêt du mode `demand`.
    if (progress !== painted.current) {
      painted.current = progress
      requestRedraw()
    }

    // L'état de lecture appartient au driver, pas à React. Sans cette synchronisation, une
    // animation qui arrive à son terme laisse le bouton sur « Pause » : la première
    // pression d'`Espace` met alors en pause ce qui est déjà arrêté, et ne fait
    // visiblement rien. C'est exactement ce qu'on a constaté.
    setPlaying((current) => (current === driver.playing ? current : driver.playing))
    if (scrubRef.current) scrubRef.current.value = String(Math.round(progress * SCRUB_STEPS))
    if (trackRef.current) trackRef.current.style.setProperty('--progress', String(progress))
    if (timeRef.current) {
      timeRef.current.textContent = `${formatSeconds(progress * driver.duration)} / ${formatSeconds(driver.duration)} s`
    }
  }, [driver])

  // `Espace` et les flèches agissent depuis **tout l'écran de leçon**, pas seulement depuis
  // la commande qui a le focus. C'est ce que fait tout lecteur, et c'est ce qui manquait :
  // arriver sur la page et appuyer sur Espace ne produisait rien, faute d'avoir d'abord
  // tabulé jusqu'au bon bouton.
  //
  // Les commandes natives gardent la priorité : un curseur focalisé répond lui-même aux
  // flèches, un bouton focalisé répond lui-même à Espace. On ne double jamais leur effet.
  useEffect(() => {
    const isNativelyHandled = (target: EventTarget | null, key: string): boolean => {
      if (!(target instanceof HTMLElement)) return false
      if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) return true
      return key === ' ' && target instanceof HTMLButtonElement
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isNativelyHandled(event.target, event.key)) return

      if (event.key === ' ') {
        event.preventDefault()
        togglePlay()
        return
      }

      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault()
        const step = event.shiftKey ? 0.1 : 0.02
        const direction = event.key === 'ArrowRight' ? 1 : -1
        driver.seek(driver.timeProgress + direction * step)
        paint()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  useEffect(() => {
    let frame = 0
    const loop = () => {
      paint()
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    paint()
    return () => cancelAnimationFrame(frame)
  }, [paint])

  const togglePlay = () => {
    if (driver.playing) driver.pause()
    else driver.play()
    setPlaying(driver.playing)
    paint()
  }

  return (
    // `section` plutôt que `div` : un `div` n'a pas de rôle, donc `aria-label` n'y est pas
    // annoncé. La barre est une région nommée de l'écran, et c'est ce qui permet à un
    // lecteur d'écran de dire ce que les raccourcis clavier pilotent.
    <section className="transport" data-testid="transport" aria-label={t('transport.label')}>
      <button
        type="button"
        className="transport__button"
        aria-label={t('transport.restart')}
        onClick={() => {
          driver.seek(0)
          paint()
        }}
      >
        <span aria-hidden="true">⏮</span>
      </button>

      <button
        type="button"
        className="transport__button transport__button--primary"
        aria-label={playing ? t('transport.pause') : t('transport.play')}
        onClick={togglePlay}
      >
        <span aria-hidden="true">{playing ? '⏸' : '▶'}</span>
      </button>

      <button
        type="button"
        className="transport__button"
        aria-label={t('transport.loop')}
        aria-pressed={looping}
        onClick={() => {
          driver.setLoop(!driver.looping)
          setLooping(driver.looping)
        }}
      >
        <span aria-hidden="true">⟳</span>
      </button>

      <div className="transport__track" ref={trackRef}>
        {/*
          Non contrôlé au sens React : la valeur part dans le driver, l'élément est
          repositionné par `paint`. Un `value` piloté par un état le re-rendrait à chaque
          frame.
        */}
        <input
          ref={scrubRef}
          type="range"
          className="transport__scrub"
          aria-label={t('transport.scrub')}
          min={0}
          max={SCRUB_STEPS}
          step={1}
          defaultValue={0}
          onInput={(event) => {
            driver.seek(Number(event.currentTarget.value) / SCRUB_STEPS)
            paint()
          }}
        />
      </div>

      <span className="transport__time" data-testid="transport-time" ref={timeRef} />
    </section>
  )
}

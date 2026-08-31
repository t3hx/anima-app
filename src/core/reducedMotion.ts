import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

// Préférence de mouvement réduit, à trois états (spec §4.8). L'interrupteur du chrome
// écrase la valeur détectée : la préférence système est un défaut, pas une prison — et
// c'est aussi un objet d'enseignement, visible en permanence sur ce site en particulier.
//
// Effet attendu quand elle est active : les démos **ne disparaissent pas**, elles passent
// en lecture manuelle — pas de lecture automatique, scrub uniquement.

export type MotionPreference = 'system' | 'forced-on' | 'forced-off'

const QUERY = '(prefers-reduced-motion: reduce)'

interface MotionState {
  readonly preference: MotionPreference
  readonly systemReduces: boolean
  setPreference: (preference: MotionPreference) => void
  /** Bascule à deux positions : c'est tout ce que le chrome expose. */
  toggle: () => void
  reset: () => void
}

const readSystem = (): boolean =>
  typeof matchMedia === 'function' ? matchMedia(QUERY).matches : false

export const motionStore = createStore<MotionState>()((set, get) => ({
  preference: 'system',
  systemReduces: readSystem(),

  setPreference: (preference) => set({ preference }),

  toggle: () => set({ preference: effective(get()) ? 'forced-off' : 'forced-on' }),

  reset: () => set({ preference: 'system', systemReduces: readSystem() }),
}))

const effective = (state: MotionState): boolean => {
  if (state.preference === 'forced-on') return true
  if (state.preference === 'forced-off') return false
  return state.systemReduces
}

/** La valeur effective, celle que toutes les scènes lisent. */
export const prefersReducedMotion = (): boolean => effective(motionStore.getState())

export const useReducedMotion = (): boolean => useStore(motionStore, effective)

export const useMotionPreference = (): MotionPreference =>
  useStore(motionStore, (state) => state.preference)

/**
 * S'abonne aux changements de la préférence système — l'utilisateur peut la modifier
 * pendant la session, dans les réglages d'accessibilité de son OS. Sans cet abonnement, la
 * valeur resterait figée à celle lue au démarrage.
 *
 * Appelé explicitement par l'application, **pas à l'import du module** : un effet de bord
 * au chargement s'exécute avant que quoi que ce soit puisse l'observer ou le remplacer, ce
 * qui le rend à la fois intestable et dépendant de l'ordre des imports.
 */
export const watchSystemPreference = (): (() => void) => {
  if (typeof matchMedia !== 'function') return () => {}

  const query = matchMedia(QUERY)
  const onChange = (event: { matches: boolean }) => {
    motionStore.setState({ systemReduces: event.matches })
  }

  motionStore.setState({ systemReduces: query.matches })
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

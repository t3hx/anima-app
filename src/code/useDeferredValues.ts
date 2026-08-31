import { paramStore } from '@core/paramStore'
import type { ParamValues } from '@core/types'
import { useEffect, useState } from 'react'

// Le panneau de code est regénéré **en différé** (spec §3) : un curseur produit soixante
// changements par seconde, et régénérer le code à chaque fois coûte plus cher que
// l'animation elle-même.
//
// `requestIdleCallback` quand le navigateur le fournit, un délai court sinon — Safari ne
// l'implémente toujours pas, et jsdom non plus.

/** Court : le code doit suivre le réglage d'assez près pour qu'on fasse le lien. */
const FALLBACK_DELAY_MS = 60

type IdleHandle =
  | { readonly kind: 'idle'; readonly id: number }
  | { readonly kind: 'timeout'; readonly id: ReturnType<typeof setTimeout> }

const scheduleIdle = (task: () => void): IdleHandle => {
  if (typeof requestIdleCallback === 'function') {
    return { kind: 'idle', id: requestIdleCallback(task, { timeout: 200 }) }
  }
  return { kind: 'timeout', id: setTimeout(task, FALLBACK_DELAY_MS) }
}

const cancelIdle = (handle: IdleHandle): void => {
  if (handle.kind === 'idle') cancelIdleCallback(handle.id)
  else clearTimeout(handle.id)
}

/**
 * Les valeurs courantes, mais rendues en différé. Le composant qui les consomme ne re-rend
 * donc pas à la cadence du curseur.
 */
export const useDeferredParamValues = (): ParamValues => {
  const [values, setValues] = useState<ParamValues>(() => paramStore.getState().values)

  useEffect(() => {
    let handle: IdleHandle | null = null

    const unsubscribe = paramStore.subscribe(
      (state) => state.values,
      (next) => {
        if (handle) cancelIdle(handle)
        handle = scheduleIdle(() => {
          handle = null
          setValues(next)
        })
      },
    )

    return () => {
      if (handle) cancelIdle(handle)
      unsubscribe()
    }
  }, [])

  return values
}

import { paramStore } from '@core/paramStore'
import type { Param, ParamValues } from '@core/types'
import { useStore } from 'zustand'

// Les valeurs dont dépend l'affichage conditionnel des contrôles, et **elles seules**.
//
// Le panneau doit se re-rendre quand la méthode change, sinon les curseurs conditionnels
// n'apparaissent ni ne disparaissent. Mais s'abonner à toutes les valeurs le re-rendrait à
// la cadence d'un curseur — exactement ce que l'architecture évite.
//
// On ne s'abonne donc qu'aux paramètres cités dans une condition. Ce sont des choix
// discrets : quelques changements par session.

export const useConditionValues = (params: readonly Param[]): ParamValues => {
  const watched = [...new Set(params.flatMap((param) => param.visibleWhen?.param ?? []))].sort()

  // La clé est une chaîne : `useSyncExternalStore` compare par référence, donc rendre un
  // objet neuf à chaque appel boucle à l'infini. On compare une signature stable.
  const signature = useStore(paramStore, (state) =>
    watched.map((id) => `${id}=${String(state.values[id] ?? '')}`).join('&'),
  )

  return Object.fromEntries(
    signature
      .split('&')
      .filter(Boolean)
      .map((pair) => {
        const [id = '', value = ''] = pair.split('=')
        return [id, value]
      }),
  )
}

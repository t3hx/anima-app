import { isWebglScene, useSceneKind } from '@scenes/sceneStore'
import { lazy, Suspense } from 'react'

// Le calque du canvas persistant, **chargé à la demande**. `CanvasHost` tire three.js,
// drei et react-three-fiber ; importé statiquement au-dessus des routes, il mettrait
// 240 ko gzip dans le chunk de la route initiale — que l'accueil n'utilise jamais.
//
// Il reste monté tant qu'une leçon WebGL est active, donc passer d'une leçon à l'autre ne
// le remonte pas : c'est là toute la persistance.

const CanvasHost = lazy(() =>
  import('@scenes/CanvasHost').then((module) => ({ default: module.CanvasHost })),
)

export function CanvasLayer() {
  const kind = useSceneKind()

  if (!isWebglScene(kind)) return null

  return (
    <Suspense fallback={null}>
      <CanvasHost />
    </Suspense>
  )
}

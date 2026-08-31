import { registerRenderer, unregisterRenderer } from '@core/diagnostics'
import { setRedrawRequester } from '@core/redraw'
import { Canvas, useThree } from '@react-three/fiber'
import { PerspectiveRig } from '@scenes/PerspectiveRig'
import {
  isWebglScene,
  useSceneAnimation,
  useSceneBox,
  useSceneDriver,
  useSceneKind,
} from '@scenes/sceneStore'
import { WebglScene } from '@scenes/WebglScene'
import { useEffect } from 'react'

// **Le** canvas react-three-fiber : un seul, monté au-dessus des routes, et dont seul le
// contenu change (spec §2, piège n°3). Le remonter à chaque navigation provoque des
// à-coups et, à terme, l'épuisement des contextes WebGL disponibles.
//
// Il se superpose au rectangle que le shell publie (`box`) : changer de leçon met à jour
// un style, pas un montage. Il ne capte aucun clic, et il passe **au-dessus** du fond de
// la boîte de scène — sans quoi il rend parfaitement, sous un aplat opaque.
//
// `frameloop="demand"` : une scène à l'arrêt ne consomme aucune image. Ce qui la réveille
// passe par `@core/redraw`.

/**
 * Publie le renderer (pour le scénario de fuite) et la fonction de redemande de rendu
 * (pour que le transport et les contrôles puissent réveiller une scène à l'arrêt).
 */
function CanvasBridge() {
  const gl = useThree((state) => state.gl)
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    registerRenderer(gl)
    return unregisterRenderer
  }, [gl])

  useEffect(() => {
    setRedrawRequester(invalidate)
    return () => setRedrawRequester(null)
  }, [invalidate])

  return null
}

export function CanvasHost() {
  const kind = useSceneKind()
  const driver = useSceneDriver()
  const animate = useSceneAnimation()
  const box = useSceneBox()

  if (!isWebglScene(kind) || !driver || !animate || !box) return null

  return (
    <Canvas
      frameloop="demand"
      style={{
        position: 'fixed',
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <CanvasBridge />
      <PerspectiveRig />
      <WebglScene driver={driver} animate={animate} />
    </Canvas>
  )
}

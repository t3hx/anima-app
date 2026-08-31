import { registerSubject, unregisterSubject } from '@core/diagnostics'
import { paramStore } from '@core/paramStore'
import { requestRedraw } from '@core/redraw'
import type { CubeAnimation, ParamValues } from '@core/types'
import { useFrame, useThree } from '@react-three/fiber'
import { createFloorTexture, createShadowTexture } from '@scenes/floorTexture'
import { setProjector } from '@scenes/projection'
import type { TimeDriver } from '@transport/TimeDriver'
import { useEffect, useMemo, useRef } from 'react'
import { DoubleSide, type Mesh, Vector3 } from 'three'

// Le cube et son sol quadrillé.
//
// Trois règles gouvernent ce composant :
//   - il **lit** la progression du driver et la passe à la fonction d'animation de la
//     leçon ; il ne calcule aucune courbe ;
//   - il lit les valeurs de paramètres **hors de React** (`paramStore.getState()`) : un
//     abonnement re-rendant à 60 Hz, sur la scène, c'est la saccade garantie ;
//   - il ne détient aucun état React. React orchestre, il n'anime pas (invariant).

/** Une trace tous les 100 ms, cinq visibles au plus (handoff, écran 2b). */
const GHOST_COUNT = 5
const GHOST_INTERVAL_MS = 100
const GHOST_OPACITY = [0.24, 0.19, 0.14, 0.1, 0.07] as const

/** Teinte de la famille `native`, en composantes — celle des lignes du sol. */
const AMBRE: readonly [number, number, number] = [240, 157, 90]

/**
 * Les trois faces du cube, aux couleurs exactes du handoff : `#F8C98F` dessus,
 * `#E0854A` à gauche, `#A9542B` à droite.
 *
 * Matériau **non éclairé** délibérément : la maquette dessine trois aplats: si l'éclairage
 * décidait des teintes, elles dépendraient de la position des lampes et ne seraient plus
 * celles du design. Ici on les pose, on ne les calcule pas.
 *
 * Ordre attendu par `BoxGeometry` : +x, -x, +y, -y, +z, -z.
 */
const FACE_TOP = '#f8c98f'
const FACE_LEFT = '#e0854a'
const FACE_RIGHT = '#a9542b'
const FACES = [FACE_RIGHT, FACE_RIGHT, FACE_TOP, FACE_RIGHT, FACE_LEFT, FACE_LEFT] as const

/**
 * Le sol est un plan fini, comme dans la maquette où il occupe la moitié basse de la scène
 * et se fond avant son bord. Un plan infini remplirait tout le cadre et il n'y aurait plus
 * d'horizon — donc plus de profondeur lisible.
 */
const FLOOR_SIZE = 64

export interface WebglSceneProps {
  readonly driver: TimeDriver
  readonly animate: CubeAnimation
}

export function WebglScene({ driver, animate }: WebglSceneProps) {
  const cube = useRef<Mesh>(null)
  const shadow = useRef<Mesh>(null)
  const ghosts = useRef<(Mesh | null)[]>([])
  const lastGhostAt = useRef(0)
  const invalidate = useThree((state) => state.invalidate)
  const camera = useThree((state) => state.camera)

  const floorMap = useMemo(() => createFloorTexture({ rgb: AMBRE }), [])
  const shadowMap = useMemo(() => createShadowTexture(), [])
  const ghostSlots = useMemo(() => Array.from({ length: GHOST_COUNT }, (_, i) => i), [])

  // Les textures sont créées ici, donc c'est ici qu'on les libère — point 7 du « terminé ».
  useEffect(
    () => () => {
      floorMap.dispose()
      shadowMap.dispose()
    },
    [floorMap, shadowMap],
  )

  // Publie la position du cube en coordonnées d'écran. Sans ce point d'observation, une
  // scène qui rend parfaitement **hors champ** est indistinguable d'une scène correcte :
  // c'est exactement ce qui est arrivé, avec toute la suite au vert.
  useEffect(() => {
    registerSubject(() => {
      if (!cube.current) return null
      const projected = new Vector3().copy(cube.current.position).project(camera)
      return { x: projected.x, y: projected.y, z: projected.z }
    })
    return unregisterSubject
  }, [camera])

  // Publie où tombe une abscisse à l'écran, pour que la règle du bas mesure vraiment l'axe
  // qu'elle prétend graduer. La hauteur choisie est celle du cube : c'est là qu'on lit sa
  // position, et en perspective une abscisse ne tombe pas au même endroit selon la
  // profondeur.
  useEffect(() => {
    setProjector((worldX) => {
      const projected = new Vector3(worldX, 0.6, 0).project(camera)
      if (!Number.isFinite(projected.x)) return null
      return (projected.x + 1) / 2
    })
    return () => setProjector(null)
  }, [camera])

  // Une scène à l'arrêt ne consomme aucune image ; il faut donc la réveiller quand une
  // valeur change, sinon régler un curseur en pause ne se voit pas.
  useEffect(() => {
    const unsubscribe = paramStore.subscribe((state) => state.values, requestRedraw)
    requestRedraw()
    return unsubscribe
  }, [])

  useFrame((_, delta) => {
    if (!cube.current) return

    const values: ParamValues = paramStore.getState().values
    const frame = animate(driver.easedProgress, values)

    cube.current.position.x = frame.x
    if (shadow.current) shadow.current.position.x = frame.x

    // Les fantômes matérialisent la vitesse : leur espacement est la distance parcourue en
    // 100 ms. Ils s'entassent à l'arrivée quand la courbe décélère — c'est l'argument
    // pédagogique du chapitre sur la courbe, pas un ornement.
    lastGhostAt.current += delta * 1000
    if (frame.showGhosts && lastGhostAt.current >= GHOST_INTERVAL_MS) {
      lastGhostAt.current = 0
      for (let index = GHOST_COUNT - 1; index > 0; index -= 1) {
        const previous = ghosts.current[index - 1]
        const target = ghosts.current[index]
        if (previous && target) target.position.x = previous.position.x
      }
      const first = ghosts.current[0]
      if (first) first.position.x = frame.x
    }

    for (const ghost of ghosts.current) {
      if (ghost) ghost.visible = frame.showGhosts
    }

    // `frameloop="demand"` : sans cette demande, rien ne se redessine.
    if (driver.playing) invalidate()
  })

  return (
    <>
      {/* Le sol, avec son fondu vers l'horizon déjà dans la texture. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -14]}>
        <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
        <meshBasicMaterial map={floorMap} transparent depthWrite={false} side={DoubleSide} />
      </mesh>

      {/* Ombre portée : elle ancre le cube au sol, sinon il flotte. */}
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[3.4, 3.4]} />
        <meshBasicMaterial map={shadowMap} transparent depthWrite={false} />
      </mesh>

      {ghostSlots.map((index) => (
        <mesh
          key={index}
          ref={(node) => {
            ghosts.current[index] = node
          }}
          position={[0, 0.6, 0]}
          rotation={[0, Math.PI / 5, 0]}
          visible={false}
        >
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshBasicMaterial color="#f09d5a" transparent opacity={GHOST_OPACITY[index] ?? 0.07} />
        </mesh>
      ))}

      {/*
        Le cube est tourné, pas la caméra. La maquette montre un sol vu de face — lignes
        verticales convergentes, horizontales droites — et un cube qui, lui, montre
        plusieurs faces. Tourner la caméra donnerait le second au prix du premier ; tourner
        l'objet donne les deux.
      */}
      <mesh ref={cube} position={[0, 0.6, 0]} rotation={[0, Math.PI / 5, 0]}>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        {FACES.map((color, index) => (
          <meshBasicMaterial
            // biome-ignore lint/suspicious/noArrayIndexKey: l'index EST l'identité de la face
            key={index}
            attach={`material-${index}`}
            color={color}
          />
        ))}
      </mesh>
    </>
  )
}

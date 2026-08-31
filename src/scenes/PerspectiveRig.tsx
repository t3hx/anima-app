import { requestRedraw } from '@core/redraw'
import { useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo } from 'react'
import { PerspectiveCamera } from 'three'

// La caméra de la scène. **Perspective à longue focale**, et le choix mérite d'être écrit
// parce qu'il a d'abord été fait à l'envers.
//
// Une première version utilisait une caméra orthographique, au motif que l'échelle
// constante préserve la lecture de la vitesse : l'espacement des fantômes *est* le contenu
// pédagogique, et une perspective marquée le fausserait — un objet qui s'éloigne se
// resserre par la profondeur, pas par la courbe.
//
// L'argument est réel mais étroit, et les maquettes disent autre chose : leur sol est une
// vraie perspective (`perspective(700px) rotateX(58deg)`), fondue vers l'horizon. Comme le
// cube se déplace sur un seul axe et que la vue est de face, la variation de profondeur sur
// le trajet est faible : une **longue focale** — champ étroit, caméra reculée — donne le
// rendu de la maquette tout en gardant la variation d'échelle à quelques pour cent.
//
// C'est le compromis habituel des photographes ; il n'y avait pas de raison de s'en priver.

/** Largeur de scène visible, en unités, à la profondeur du sujet. */
const VISIBLE_WIDTH = 23

/** La maquette incline son sol de 58°, soit une caméra à 32° au-dessus de l'horizontale. */
const ELEVATION_DEGREES = 30

/** Reculée : c'est la distance, plus que le champ, qui aplatit la perspective. */
const DISTANCE = 38

export interface PerspectiveRigProps {
  readonly target?: readonly [number, number, number]
}

export function PerspectiveRig({ target = [0, 0.6, 0] }: PerspectiveRigProps) {
  const set = useThree((state) => state.set)
  const size = useThree((state) => state.size)

  const camera = useMemo(() => {
    const created = new PerspectiveCamera()
    // react-three-fiber recadre lui-même les caméras par défaut ; on s'en charge.
    ;(created as PerspectiveCamera & { manual?: boolean }).manual = true
    return created
  }, [])

  useLayoutEffect(() => {
    if (size.width === 0 || size.height === 0) return

    const aspect = size.width / size.height
    // Champ vertical déduit de la largeur voulue : c'est la largeur qui cadre le trajet,
    // la hauteur suit la forme de la boîte.
    const visibleHeight = VISIBLE_WIDTH / aspect
    const fov = 2 * Math.atan(visibleHeight / 2 / DISTANCE) * (180 / Math.PI)

    const elevation = (ELEVATION_DEGREES * Math.PI) / 180
    camera.fov = fov
    camera.aspect = aspect
    camera.near = 0.1
    camera.far = 400
    camera.position.set(0, DISTANCE * Math.sin(elevation), DISTANCE * Math.cos(elevation))
    camera.lookAt(target[0], target[1], target[2])
    camera.updateProjectionMatrix()
    requestRedraw()
  }, [camera, size, target])

  useLayoutEffect(() => {
    set({ camera })
  }, [camera, set])

  return null
}

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Phase } from '../types'
import { SCREEN_CENTER, SCREEN_H, SCREEN_NORMAL, SCREEN_W } from './cabinetGeometry'

const REST_TARGET = new THREE.Vector3(0, 1.12, 0)
const INTRO_SECONDS = 2.4
const ZOOM_IN_SECONDS = 1.6
const ZOOM_OUT_SECONDS = 1.4

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

type Props = {
  phase: Phase
  parallax: boolean
  onZoomInDone: () => void
  onZoomOutDone: () => void
}

/**
 * Moves the camera between a resting view of the room and a view where the main
 * cabinet's screen fills the viewport. `progress` 0 is the room, 1 is the screen.
 */
export default function CameraRig({ phase, parallax, onZoomInDone, onZoomOutDone }: Props) {
  const progress = useRef(phase === 'room' ? 0 : 1)
  const intro = useRef(phase === 'room' ? 0 : 1)
  const reported = useRef<Phase | null>(null)
  const look = useRef(new THREE.Vector2())
  const v = useMemo(() => ({ rest: new THREE.Vector3(), zoom: new THREE.Vector3(), target: new THREE.Vector3() }), [])

  // "Skip intro" jumps straight to the menu, so leaving it should start from the screen
  useEffect(() => {
    if (phase === 'menu') progress.current = 1
  }, [phase])

  useFrame((state, delta) => {
    // cap long stalls (tab switches), but keep real time on slow devices so the dive never drags
    const dt = Math.min(delta, 0.1)
    const camera = state.camera as THREE.PerspectiveCamera
    const aspect = state.size.width / state.size.height

    intro.current = Math.min(1, intro.current + dt / INTRO_SECONDS)
    if (phase === 'zoomIn') progress.current = Math.min(1, progress.current + dt / ZOOM_IN_SECONDS)
    if (phase === 'zoomOut') progress.current = Math.max(0, progress.current - dt / ZOOM_OUT_SECONDS)
    if (parallax) look.current.lerp(state.pointer, 1 - Math.exp(-dt * 3))

    // far enough back that the whole cabinet fits, even on a portrait phone
    const distance = Math.max(4, 1.57 / aspect)
    const settle = 1 - easeOut(intro.current)
    v.rest.set(look.current.x * 0.35, 1.4 + look.current.y * 0.12 + settle * 0.6, distance + settle * 2.6)

    // close enough that the screen overfills the viewport in both directions
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const screenDistance = Math.min(SCREEN_H / 2 / tanHalf, SCREEN_W / 2 / (tanHalf * aspect)) * 0.92
    v.zoom.copy(SCREEN_CENTER).addScaledVector(SCREEN_NORMAL, screenDistance)

    const e = easeInOut(progress.current)
    camera.position.lerpVectors(v.rest, v.zoom, e)
    v.target.lerpVectors(REST_TARGET, SCREEN_CENTER, e)
    camera.lookAt(v.target)

    if (phase === 'zoomIn' && progress.current >= 1 && reported.current !== 'zoomIn') {
      reported.current = 'zoomIn'
      onZoomInDone()
    }
    if (phase === 'zoomOut' && progress.current <= 0 && reported.current !== 'zoomOut') {
      reported.current = 'zoomOut'
      onZoomOutDone()
    }
  })

  return null
}

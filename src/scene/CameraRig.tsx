import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Phase } from '../types'
import { REST_DIRECTION, REST_DISTANCE, REST_TARGET, SCREEN_CENTER, SCREEN_H, SCREEN_NORMAL, SCREEN_W } from './layout'

const INTRO_SECONDS = 2.4
/** Width around the monitor (the desk and window) that must stay in frame on narrow screens. */
const KEEP_IN_VIEW = 1.45
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
 * Moves the camera between a resting view of the room and a view where the monitor's
 * screen fills the viewport. `progress` 0 is the room, 1 is the screen.
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

    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))

    // back off on narrow screens so the desk and window still fit; drift in during the intro
    const distance = Math.max(REST_DISTANCE, KEEP_IN_VIEW / (2 * tanHalf * aspect))
    const settle = 1 - easeOut(intro.current)
    v.rest.copy(REST_TARGET).addScaledVector(REST_DIRECTION, distance + settle * 1.4)
    v.rest.x += look.current.x * 0.25
    v.rest.y += look.current.y * 0.1 + settle * 0.3

    // close enough that the screen overfills the viewport in both directions
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

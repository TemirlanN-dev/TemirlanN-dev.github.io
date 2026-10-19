import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/**
 * Seconds this component has spent animating. R3F's own clock resets to zero whenever the
 * frame loop restarts (it pauses while the menu is open), so a moment remembered against it,
 * like "the chime was struck at 12.3 s", lands in the future and decays turn into blow-ups.
 * This clock only ever moves forward.
 */
export function useSceneTime() {
  const time = useRef(0)
  useFrame((_, delta) => {
    time.current += Math.min(delta, 0.1)
  })
  return time
}

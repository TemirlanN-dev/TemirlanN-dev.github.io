import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor, Sparkles } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import type { Phase } from '../types'
import { isCoarsePointer, isLowPower } from '../lib/env'
import { useMotion } from '../lib/motion'
import CameraRig from './CameraRig'
import Corner from './Corner'
import Desk from './Desk'
import { useDaylight, type Daylight } from './daylight'
import { createLockScreen } from './lockScreen'
import Room from './Room'
import Sea from './Sea'
import WindowView from './WindowView'

export type SceneProps = {
  phase: Phase
  onStart: () => void
  onZoomInDone: () => void
  onZoomOutDone: () => void
  onToast: (message: string) => void
  onReady: () => void
}

/**
 * Sun (or moon) shining in through the window, plus sky light filling the room; all of it
 * follows the time of day. In the afternoon the sun sits high on the right, so the window's
 * patch lands on the floor left of the desk and up the left wall, where the camera sees it.
 */
function Lights({ lowPower, daylight }: { lowPower: boolean; daylight: Daylight }) {
  const sun = useRef<THREE.DirectionalLight>(null)
  const target = useRef<THREE.Object3D>(null)
  useEffect(() => {
    if (sun.current && target.current) sun.current.target = target.current
  }, [])
  const map = lowPower ? 1024 : 2048
  const { light, hemi, fill } = daylight

  return (
    <>
      <hemisphereLight args={[hemi.sky, hemi.ground, hemi.intensity]} />
      <ambientLight intensity={0.2} color={fill.color} />
      {/* fill from the open side of the room, so walls facing us aren't left in shade */}
      <directionalLight position={[1.5, 3, 5]} intensity={fill.intensity} color={fill.color} />
      <directionalLight
        ref={sun}
        position={light.position}
        intensity={light.intensity}
        color={light.color}
        castShadow
        shadow-mapSize={[map, map]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={1}
        shadow-camera-far={20}
      />
      <object3D ref={target} position={[-0.3, 0.4, -0.3]} />
    </>
  )
}

export default function Scene({ phase, onStart, onZoomInDone, onZoomOutDone, onToast, onReady }: SceneProps) {
  // start light on phones; anywhere else, drop to light mode if the frame rate sags
  const [lowPower, setLowPower] = useState(isLowPower)
  const motion = useMotion()
  const parallax = motion && !isCoarsePointer()
  const screen = useMemo(createLockScreen, [])
  const daylight = useDaylight()
  const [hovered, setHovered] = useState(false)
  const interactive = phase === 'room'

  useEffect(() => {
    if (phase === 'zoomIn' || phase === 'menu') screen.setMode('boot')
    else screen.setMode(hovered && interactive ? 'hover' : 'locked')
  }, [phase, hovered, interactive, screen])

  return (
    <div className="scene">
      <Canvas
        shadows="percentage"
        dpr={lowPower ? 1 : [1, 1.5]}
        frameloop={phase === 'menu' ? 'never' : 'always'}
        camera={{ fov: 50, near: 0.05, far: 900, position: [0.4, 1.9, 4.6] }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        onCreated={onReady}
      >
        <PerformanceMonitor bounds={() => [40, 1000]} onDecline={() => setLowPower(true)} />
        <color attach="background" args={['#cfe6ff']} />
        <Lights lowPower={lowPower} daylight={daylight} />
        <WindowView daylight={daylight} />
        <Sea daylight={daylight} />
        <Room interactive={interactive} />
        <Desk screen={screen} interactive={interactive} onStart={onStart} onScreenHover={setHovered} lampOn={daylight.lampOn} screenGlow={daylight.screenGlow} />
        <Corner interactive={interactive} onToast={onToast} />
        {/* dust drifting in the light from the window */}
        <Sparkles count={lowPower ? 20 : 45} scale={[2.2, 1.2, 1.4]} position={[0.3, 1.25, -0.4]} size={1.6} speed={motion ? 0.2 : 0} opacity={daylight.dust} color={daylight.light.color} />
        <CameraRig phase={phase} parallax={parallax} onZoomInDone={onZoomInDone} onZoomOutDone={onZoomOutDone} />

        <EffectComposer multisampling={lowPower ? 0 : 4}>
          <Bloom mipmapBlur luminanceThreshold={1} intensity={0.6} radius={0.7} />
          <Vignette offset={0.3} darkness={0.4} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}

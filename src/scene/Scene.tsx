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
import { createLockScreen } from './lockScreen'
import Room from './Room'
import WindowView from './WindowView'

export type SceneProps = {
  phase: Phase
  onStart: () => void
  onZoomInDone: () => void
  onZoomOutDone: () => void
  onToast: (message: string) => void
  onReady: () => void
}

/** Afternoon sun pouring in through the window, plus soft sky light filling the room. */
function Lights({ lowPower }: { lowPower: boolean }) {
  const sun = useRef<THREE.DirectionalLight>(null)
  const target = useRef<THREE.Object3D>(null)
  useEffect(() => {
    if (sun.current && target.current) sun.current.target = target.current
  }, [])
  const map = lowPower ? 1024 : 2048

  return (
    <>
      <hemisphereLight args={['#d6ecff', '#c99f70', 1.1]} />
      <ambientLight intensity={0.25} color="#fff1e0" />
      {/* warm fill from the open side of the room, so walls facing us aren't left in shade */}
      <directionalLight position={[1.5, 3, 5]} intensity={1.4} color="#fff0dc" />
      {/* afternoon sun high on the right: the window and its lattice land as a bright patch
          on the floor left of the desk and up the left wall, where the camera can see it */}
      <directionalLight
        ref={sun}
        position={[6, 7, -4]}
        intensity={3.2}
        color="#fff2dc"
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
      <object3D ref={target} position={[-0.6, 0.3, -0.3]} />
    </>
  )
}

export default function Scene({ phase, onStart, onZoomInDone, onZoomOutDone, onToast, onReady }: SceneProps) {
  // start light on phones; anywhere else, drop to light mode if the frame rate sags
  const [lowPower, setLowPower] = useState(isLowPower)
  const motion = useMotion()
  const parallax = motion && !isCoarsePointer()
  const screen = useMemo(createLockScreen, [])
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
        camera={{ fov: 50, near: 0.05, far: 60, position: [0.4, 1.9, 4.6] }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        onCreated={onReady}
      >
        <PerformanceMonitor bounds={() => [40, 1000]} onDecline={() => setLowPower(true)} />
        <color attach="background" args={['#cfe6ff']} />
        <Lights lowPower={lowPower} />
        <WindowView />
        <Room interactive={interactive} />
        <Desk screen={screen} interactive={interactive} onStart={onStart} onScreenHover={setHovered} />
        <Corner interactive={interactive} onToast={onToast} />
        {/* dust drifting in the sunbeam */}
        <Sparkles count={lowPower ? 20 : 45} scale={[2.2, 1.2, 1.4]} position={[0.3, 1.25, -0.4]} size={1.6} speed={motion ? 0.2 : 0} opacity={0.7} color="#fff3d6" />
        <CameraRig phase={phase} parallax={parallax} onZoomInDone={onZoomInDone} onZoomOutDone={onZoomOutDone} />

        <EffectComposer multisampling={lowPower ? 0 : 4}>
          <Bloom mipmapBlur luminanceThreshold={1} intensity={0.6} radius={0.7} />
          <Vignette offset={0.3} darkness={0.4} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}

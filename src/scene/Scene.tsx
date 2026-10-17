import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor, Sparkles } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import type { Phase } from '../types'
import { isCoarsePointer, isLowPower } from '../lib/env'
import { useMotion } from '../lib/motion'
import Cabinet from './Cabinet'
import CameraRig from './CameraRig'
import Room from './Room'
import { createMainScreen, createOutOfOrderScreen, createPaddleScreen } from './screens'

export type SceneProps = {
  phase: Phase
  onStart: () => void
  onZoomInDone: () => void
  onZoomOutDone: () => void
  onToast: (message: string) => void
  onReady: () => void
}

const BACKGROUND = '#05040b'

function Lights() {
  const spot = useRef<THREE.SpotLight>(null)
  const target = useRef<THREE.Object3D>(null)
  useEffect(() => {
    if (spot.current && target.current) spot.current.target = target.current
  }, [])

  return (
    <>
      <ambientLight intensity={0.35} color="#8a8cff" />
      <spotLight ref={spot} position={[0, 4.5, 2.2]} angle={0.45} penumbra={0.85} intensity={40} distance={12} decay={2} color="#c4d2ff" />
      <object3D ref={target} position={[0, 1.1, 0]} />
      <pointLight position={[-2.6, 2.4, 0.6]} color="#ff3d9a" intensity={14} distance={8} decay={2} />
      <pointLight position={[2.6, 2.4, 0.6]} color="#3dd8ff" intensity={14} distance={8} decay={2} />
      {/* the main screen's glow spilling onto the controls */}
      <pointLight position={[0, 1.4, 0.75]} color="#3f7dff" intensity={2.5} distance={2.5} decay={2} />
    </>
  )
}

export default function Scene({ phase, onStart, onZoomInDone, onZoomOutDone, onToast, onReady }: SceneProps) {
  // start light on phones; anywhere else, drop to light mode if the frame rate sags
  const [lowPower, setLowPower] = useState(isLowPower)
  const parallax = useMotion() && !isCoarsePointer()
  const mainScreen = useMemo(createMainScreen, [])
  const paddleScreen = useMemo(createPaddleScreen, [])
  const brokenScreen = useMemo(createOutOfOrderScreen, [])
  const [hovered, setHovered] = useState(false)
  const interactive = phase === 'room'

  useEffect(() => {
    if (phase === 'zoomIn' || phase === 'menu') mainScreen.setMode('boot')
    else mainScreen.setMode(hovered && interactive ? 'hover' : 'attract')
  }, [phase, hovered, interactive, mainScreen])

  return (
    <div className="scene">
      <Canvas
        dpr={lowPower ? 1 : [1, 1.5]}
        frameloop={phase === 'menu' ? 'never' : 'always'}
        camera={{ fov: 45, near: 0.05, far: 40, position: [0, 2, 6] }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        onCreated={onReady}
      >
        <PerformanceMonitor bounds={() => [40, 1000]} onDecline={() => setLowPower(true)} />
        <color attach="background" args={[BACKGROUND]} />
        <fog attach="fog" args={[BACKGROUND, 6, 14]} />
        <Lights />
        <Room lowPower={lowPower} />

        <Cabinet
          screen={mainScreen}
          marquee="TEMIRLAN"
          accent="#4de1ff"
          sideColor="#17124a"
          featured
          interactive={interactive}
          onActivate={onStart}
          onHover={setHovered}
        />
        <Cabinet
          position={[-1.45, 0, 0.1]}
          rotationY={0.38}
          screen={paddleScreen}
          marquee="PADDLES"
          accent="#ff4fa3"
          sideColor="#3a0f33"
          interactive={interactive}
          onActivate={() => onToast('PADDLES needs a second player. Try the middle cabinet.')}
        />
        <Cabinet
          position={[1.45, 0, 0.1]}
          rotationY={-0.38}
          screen={brokenScreen}
          marquee="STAR RAID"
          accent="#ffb23f"
          sideColor="#3a260c"
          interactive={interactive}
          onActivate={() => onToast('OUT OF ORDER. Try the middle cabinet.')}
        />

        <Sparkles count={lowPower ? 30 : 70} scale={[6, 3, 3]} position={[0, 1.8, 0.6]} size={2} speed={0.3} opacity={0.5} color="#9fd8ff" noise={0.5} />
        <CameraRig phase={phase} parallax={parallax} onZoomInDone={onZoomInDone} onZoomOutDone={onZoomOutDone} />

        <EffectComposer multisampling={lowPower ? 0 : 4}>
          <Bloom mipmapBlur luminanceThreshold={1} intensity={1.3} radius={0.75} />
          <Vignette offset={0.25} darkness={0.7} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}

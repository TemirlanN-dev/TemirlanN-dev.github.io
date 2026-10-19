import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { sfx } from '../lib/sound'
import { DESK_TOP, MONITOR, SCREEN_CENTER, SCREEN_H, SCREEN_W } from './layout'
import type { ScreenProgram } from './lockScreen'
import { useAnimatedTexture, useStaticTexture } from './textures'
import { Block, Clickable, Part, Rod, Toon } from './toon'

const DESK_WOOD = '#d9b48a'
const WHITE = '#f1eee8'
const DARK = '#2a2c36'
const BLUE = '#3d6df2'
const SCREEN_BOOST = new THREE.Color(1.05, 1.05, 1.05)

function paintKeys(c: CanvasRenderingContext2D, w: number, h: number) {
  c.fillStyle = '#d9dde6'
  c.fillRect(0, 0, w, h)
  c.fillStyle = '#ffffff'
  const rows = 5
  const cols = 14
  const kw = w / cols
  const kh = h / rows
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      if (r === rows - 1 && k > 3 && k < 10) continue // space bar row
      c.fillRect(k * kw + 2, r * kh + 2, kw - 4, kh - 4)
    }
  }
  c.fillRect(4 * kw + 2, (rows - 1) * kh + 2, 6 * kw - 4, kh - 4)
}

function Monitor({ screen, interactive, onStart, onHover }: { screen: ScreenProgram; interactive: boolean; onStart: () => void; onHover: (h: boolean) => void }) {
  const texture = useAnimatedTexture(screen.width, screen.height, screen.draw, screen.fps)
  const { x, y, z, width, height, depth } = MONITOR
  return (
    <Clickable enabled={interactive} onClick={onStart} onHover={onHover}>
      <Block size={[width, height, depth]} position={[x, y, z]} color={DARK} />
      <mesh position={SCREEN_CENTER}>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
        <meshBasicMaterial map={texture} color={SCREEN_BOOST} toneMapped={false} />
      </mesh>
      <Block size={[0.05, 0.2, 0.04]} position={[x, DESK_TOP + 0.1, z - 0.035]} color={DARK} />
      <Block size={[0.24, 0.015, 0.16]} position={[x, DESK_TOP + 0.008, z - 0.02]} color={DARK} />
    </Clickable>
  )
}

/** Desk lamp: comes on by itself in the evening; click to switch it either way. */
function Lamp({ interactive, autoOn }: { interactive: boolean; autoOn: boolean }) {
  const [on, setOn] = useState(autoOn)
  useEffect(() => setOn(autoOn), [autoOn])
  const spot = useRef<THREE.SpotLight>(null)
  const target = useRef<THREE.Object3D>(null)
  useEffect(() => {
    if (spot.current && target.current) spot.current.target = target.current
  }, [])

  const base: THREE.Vector3Tuple = [-0.62, DESK_TOP + 0.02, -1.0]
  const elbow: THREE.Vector3Tuple = [-0.6, 1.2, -1.04]
  const head: THREE.Vector3Tuple = [-0.43, 1.27, -0.86]
  return (
    <Clickable
      enabled={interactive}
      onClick={() => {
        setOn((v) => !v)
        sfx.click()
      }}
    >
      <Part position={[base[0], DESK_TOP + 0.012, base[2]]} color={WHITE} shape={<cylinderGeometry args={[0.07, 0.075, 0.025, 24]} />} />
      <Rod from={base} to={elbow} radius={0.011} color={WHITE} />
      <Rod from={elbow} to={head} radius={0.011} color={WHITE} />
      <group position={head} rotation={[0.35, 0, 0.45]}>
        <Part position={[0, -0.03, 0]} color={WHITE} shape={<cylinderGeometry args={[0.025, 0.075, 0.1, 24, 1, true]} />} />
        <mesh position={[0, -0.06, 0]}>
          <sphereGeometry args={[0.024, 12, 8]} />
          <meshBasicMaterial color={on ? new THREE.Color(3, 2.4, 1.4) : '#d8d2c4'} toneMapped={false} />
        </mesh>
        <spotLight ref={spot} position={[0, -0.05, 0]} intensity={on ? 3.5 : 0} angle={0.75} penumbra={0.7} distance={1.8} decay={1.6} color="#ffcf8a" />
      </group>
      <object3D ref={target} position={[-0.3, DESK_TOP, -0.72]} />
    </Clickable>
  )
}

function Headphones() {
  // lying flat on the desk: the band as half a torus, cups at its ends
  return (
    <group position={[0.5, DESK_TOP + 0.018, -0.6]} rotation={[0, -0.5, 0]}>
      <Part rotation={[-Math.PI / 2, 0, 0]} color="#3a3d4a" shape={<torusGeometry args={[0.085, 0.009, 8, 24, Math.PI]} />} />
      {[-0.085, 0.085].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Part color="#e9edf5" shape={<cylinderGeometry args={[0.036, 0.036, 0.03, 20]} />} />
          <Part position={[0, 0.016, 0]} color={BLUE} ink={false} shape={<cylinderGeometry args={[0.026, 0.026, 0.004, 20]} />} />
        </group>
      ))}
    </group>
  )
}

function Mug() {
  return (
    <group position={[-0.38, DESK_TOP + 0.05, -0.66]}>
      <Part color="#f3f6fb" shape={<cylinderGeometry args={[0.038, 0.035, 0.1, 20]} />} />
      <Part position={[0, 0.02, 0]} color={BLUE} ink={false} shape={<cylinderGeometry args={[0.0385, 0.037, 0.022, 20]} />} />
      <Part position={[0, 0.049, 0]} color="#5a3420" ink={false} shape={<cylinderGeometry args={[0.032, 0.032, 0.003, 20]} />} />
      <Part position={[0.045, 0, 0]} color="#f3f6fb" shape={<torusGeometry args={[0.024, 0.007, 8, 16]} />} />
    </group>
  )
}

function Books() {
  const stack: [w: number, h: number, d: number, color: string, turn: number][] = [
    [0.22, 0.035, 0.16, '#e5232e', 0.05],
    [0.2, 0.03, 0.15, BLUE, -0.08],
    [0.21, 0.04, 0.155, '#f2c14e', 0.12],
  ]
  let y = DESK_TOP
  return (
    <group position={[0.36, 0, -1.0]}>
      {stack.map(([w, h, d, color, turn]) => {
        y += h
        return <Block key={color} size={[w, h, d]} position={[0, y - h / 2, 0]} rotation={[0, turn, 0]} color={color} />
      })}
    </group>
  )
}

function DeskPlant() {
  const leaves = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2
    return { a, tilt: 0.35 + (i % 3) * 0.12, h: 0.1 + (i % 2) * 0.03 }
  })
  return (
    <group position={[0.66, DESK_TOP, -1.02]}>
      <Part position={[0, 0.06, 0]} color="#d0764a" shape={<cylinderGeometry args={[0.065, 0.05, 0.12, 20]} />} />
      <Part position={[0, 0.118, 0]} color="#5a3a24" ink={false} shape={<cylinderGeometry args={[0.058, 0.058, 0.006, 20]} />} />
      {leaves.map(({ a, tilt, h }) => (
        <group key={a} position={[0, 0.12, 0]} rotation={[0, a, 0]}>
          <Part position={[0, h * 0.9, 0.035]} rotation={[tilt, 0, 0]} scale={[0.022, h, 0.04]} color={a < 3 ? '#5bb36a' : '#4c9c5c'} shape={<sphereGeometry args={[1, 12, 8]} />} />
        </group>
      ))}
    </group>
  )
}

type DeskProps = {
  screen: ScreenProgram
  interactive: boolean
  onStart: () => void
  onScreenHover: (h: boolean) => void
  lampOn: boolean
  /** how strongly the screen lights the keyboard; much more noticeable at night */
  screenGlow: number
}

export default function Desk({ screen, interactive, onStart, onScreenHover, lampOn, screenGlow }: DeskProps) {
  const keys = useStaticTexture(448, 160, paintKeys, [])
  const top = DESK_TOP
  return (
    <>
      {/* desk: wooden top, a white side panel and a white drawer unit */}
      <Block size={[1.6, 0.04, 0.68]} position={[0, top - 0.02, -0.82]} color={DESK_WOOD} />
      <Block size={[0.04, top - 0.04, 0.62]} position={[-0.76, (top - 0.04) / 2, -0.82]} color={WHITE} />
      <Block size={[0.38, top - 0.06, 0.6]} position={[0.57, (top - 0.06) / 2, -0.82]} color={WHITE} />
      {[0.25, 0.48].map((y) => (
        <Block key={y} size={[0.34, 0.006, 0.006]} position={[0.57, y, -0.52]} color="#c9c4ba" ink={false} />
      ))}
      {[0.14, 0.37, 0.6].map((y) => (
        <Block key={y} size={[0.07, 0.014, 0.014]} position={[0.57, y, -0.515]} color={DARK} />
      ))}

      <Monitor screen={screen} interactive={interactive} onStart={onStart} onHover={onScreenHover} />
      {/* the screen's glow on the keyboard */}
      <pointLight position={[0, 1.1, -0.7]} color="#8fc8ff" intensity={screenGlow} distance={1.6} decay={2} />

      <group position={[0, top + 0.011, -0.62]}>
        <Block size={[0.44, 0.022, 0.14]} color="#f2f2f5" />
        <mesh position={[0, 0.0115, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.42, 0.125]} />
          <Toon color="#ffffff" map={keys} />
        </mesh>
      </group>
      <Part position={[0.33, top + 0.012, -0.6]} scale={[0.032, 0.016, 0.05]} color="#f2f2f5" shape={<sphereGeometry args={[1, 16, 10]} />} />

      <Lamp interactive={interactive} autoOn={lampOn} />
      <Mug />
      <Headphones />
      <Books />
      <DeskPlant />
    </>
  )
}

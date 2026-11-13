import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { sfx } from '../lib/sound'
import { DESK_TOP, MONITOR, SCREEN_CENTER, SCREEN_H, SCREEN_W } from './layout'
import type { ScreenProgram } from './lockScreen'
import Peripherals from './Peripherals'
import { Book, LEAF } from './props'
import { useAnimatedTexture } from './textures'
import { Block, Clickable, Part, Rod } from './toon'

const DESK_WOOD = '#d9b48a'
const WHITE = '#f1eee8'
const DARK = '#2a2c36'
const BLUE = '#3d6df2'
const SCREEN_BOOST = new THREE.Color(1.05, 1.05, 1.05)

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
      <Part position={[base[0], DESK_TOP + 0.012, base[2]]} color={WHITE} shape={<cylinderGeometry args={[0.07, 0.075, 0.025, 7]} />} />
      <Rod from={base} to={elbow} radius={0.011} color={WHITE} />
      <Rod from={elbow} to={head} radius={0.011} color={WHITE} />
      <group position={head} rotation={[0.35, 0, 0.45]}>
        <Part position={[0, -0.03, 0]} color={WHITE} shape={<cylinderGeometry args={[0.025, 0.075, 0.1, 7, 1, true]} />} />
        <mesh position={[0, -0.06, 0]}>
          <sphereGeometry args={[0.024, 7, 5]} />
          <meshBasicMaterial color={on ? new THREE.Color(3, 2.4, 1.4) : '#d8d2c4'} toneMapped={false} />
        </mesh>
        <spotLight ref={spot} position={[0, -0.05, 0]} intensity={on ? 3.5 : 0} angle={0.75} penumbra={0.7} distance={1.8} decay={1.6} color="#ffcf8a" />
      </group>
      <object3D ref={target} position={[-0.3, DESK_TOP, -0.72]} />
    </Clickable>
  )
}

function Mug() {
  return (
    <group position={[-0.38, DESK_TOP + 0.05, -0.66]}>
      <Part color="#f3f6fb" shape={<cylinderGeometry args={[0.038, 0.035, 0.1, 7]} />} />
      <Part position={[0, 0.02, 0]} color={BLUE} ink={false} shape={<cylinderGeometry args={[0.0385, 0.037, 0.022, 7]} />} />
      <Part position={[0, 0.049, 0]} color="#5a3420" ink={false} shape={<cylinderGeometry args={[0.032, 0.032, 0.003, 7]} />} />
      <Part position={[0.045, 0, 0]} color="#f3f6fb" shape={<torusGeometry args={[0.024, 0.007, 4, 9]} />} />
    </group>
  )
}

function Books() {
  // height (lying flat, it runs left to right), thickness, depth, cover, accent, label, turn
  const stack: [h: number, t: number, d: number, color: string, accent: string, label: string, turn: number][] = [
    [0.22, 0.035, 0.16, '#e5232e', '#f6efdc', '#2a2c36', 0.05],
    [0.2, 0.03, 0.15, BLUE, '#f2c14e', '#f6efdc', -0.08],
    [0.21, 0.04, 0.155, '#f2c14e', '#e5232e', '#fff8e6', 0.12],
  ]
  let y = DESK_TOP
  return (
    <group position={[0.36, 0, -1.0]}>
      {stack.map(([h, t, d, color, accent, label, turn]) => {
        y += t
        // lay a standing book on its side (rotate about z), then turn it a little on the pile
        return <Book key={color} thickness={t} height={h} depth={d} color={color} accent={accent} label={label} position={[0, y - t / 2, 0]} rotation={[0, turn, Math.PI / 2]} />
      })}
    </group>
  )
}

function DeskPlant() {
  const leaves = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + (i % 2) * 0.3
    return { a, lift: 0.75 + (i % 3) * 0.22, length: 0.15 + (i % 2) * 0.04 }
  })
  return (
    <group position={[0.66, DESK_TOP, -1.02]}>
      <Part position={[0, 0.004, 0]} color="#b8623c" shape={<cylinderGeometry args={[0.058, 0.058, 0.008, 7]} />} />
      <Part position={[0, 0.06, 0]} color="#d0764a" shape={<cylinderGeometry args={[0.062, 0.048, 0.11, 7]} />} />
      <Part position={[0, 0.112, 0]} color="#dc8558" shape={<cylinderGeometry args={[0.07, 0.07, 0.02, 7]} />} />
      <Part position={[0, 0.121, 0]} color="#5a3a24" ink={false} castShadow={false} shape={<cylinderGeometry args={[0.058, 0.058, 0.006, 7]} />} />
      {leaves.map(({ a, lift, length }, i) => (
        <group key={a} position={[0, 0.12, 0]} rotation={[0, a, 0]}>
          <Part position={[0, 0, 0.012]} rotation={[-lift, 0, 0]} scale={[0.085, 0.085, length]} color={i % 2 ? '#5bb36a' : '#4c9c5c'} shape={<primitive object={LEAF} attach="geometry" />} />
        </group>
      ))}
    </group>
  )
}

/** A bar pull: two posts and the bar between them, standing off the face at z = 0. */
function BarPull({ position, width }: { position: THREE.Vector3Tuple; width: number }) {
  return (
    <group position={position}>
      {[-1, 1].map((side) => (
        <Block key={side} size={[0.012, 0.012, 0.022]} position={[side * (width / 2 - 0.016), 0, 0.011]} color={DARK} ink={false} />
      ))}
      <Block size={[width, 0.016, 0.012]} position={[0, 0, 0.026]} color={DARK} />
    </group>
  )
}

/** The desk itself: a wooden top on a white panel leg and a three-drawer pedestal, tied together by a back panel. */
function DeskFrame() {
  const top = DESK_TOP
  const under = top - 0.04 // underside of the desktop
  const z = -0.82
  // pedestal
  const px = 0.57
  const pw = 0.38
  const pd = 0.6
  const kick = 0.05
  const front = z + pd / 2
  const gap = 0.012
  const faceTop = under - 0.022
  const faceBottom = kick + 0.016
  const faceH = (faceTop - faceBottom - 2 * gap) / 3
  return (
    <>
      <Block size={[1.6, 0.04, 0.68]} position={[0, top - 0.02, z]} color={DESK_WOOD} />
      {/* a darker edge band along the front of the top */}
      <Block size={[1.602, 0.012, 0.004]} position={[0, top - 0.034, z + 0.34]} color="#b98f62" ink={false} castShadow={false} />
      <Block size={[0.04, under, 0.62]} position={[-0.76, under / 2, z]} color={WHITE} />
      <Block size={[1.14, 0.28, 0.02]} position={[-0.18, under - 0.14, z - 0.27]} color={WHITE} />

      {/* pedestal: recessed plinth, carcass, and three drawer fronts standing proud of a shadowed face */}
      <Block size={[pw - 0.03, kick, pd - 0.05]} position={[px, kick / 2, z - 0.01]} color="#8f8a80" />
      <Block size={[pw, under - kick, pd]} position={[px, (under + kick) / 2, z]} color={WHITE} />
      <Block size={[pw - 0.024, faceTop - faceBottom + 0.012, 0.004]} position={[px, (faceTop + faceBottom) / 2, front + 0.001]} color="#8f8a80" ink={false} castShadow={false} />
      {[0, 1, 2].map((i) => {
        const y = faceBottom + faceH / 2 + i * (faceH + gap)
        return (
          <group key={i}>
            <Block size={[pw - 0.036, faceH, 0.016]} position={[px, y, front + 0.009]} color="#fbf9f4" />
            <BarPull position={[px, y + faceH / 2 - 0.045, front + 0.017]} width={0.13} />
          </group>
        )
      })}
    </>
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
  return (
    <>
      <DeskFrame />

      <Monitor screen={screen} interactive={interactive} onStart={onStart} onHover={onScreenHover} />
      {/* the screen's glow on the keyboard */}
      <pointLight position={[0, 1.1, -0.7]} color="#8fc8ff" intensity={screenGlow} distance={1.6} decay={2} />

      <Peripherals />

      <Lamp interactive={interactive} autoOn={lampOn} />
      <Mug />
      <Books />
      <DeskPlant />
    </>
  )
}

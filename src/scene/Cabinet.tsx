import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import {
  CABINET_WIDTH as W,
  EDGE,
  EDGES,
  PANEL_THICKNESS,
  SCREEN_H,
  SCREEN_OFFSET,
  SCREEN_W,
  SIDE_GEOMETRY,
  SIDE_THICKNESS,
  trimPoints,
} from './cabinetGeometry'
import { useAnimatedTexture, useStaticTexture } from './textures'
import { NEON_FONT, paintMarquee, type ScreenProgram } from './screens'

type CabinetProps = {
  position?: [number, number, number]
  rotationY?: number
  screen: ScreenProgram
  marquee: string
  accent: string
  sideColor: string
  /** the cabinet you're meant to play: brighter trim that flares on hover */
  featured?: boolean
  interactive: boolean
  onActivate: () => void
  onHover?: (hovered: boolean) => void
}

const TRIM_RIGHT = trimPoints(W / 2 + SIDE_THICKNESS + 0.002)
const TRIM_LEFT = trimPoints(-W / 2 - SIDE_THICKNESS - 0.002)
const SCREEN_BOOST = new THREE.Color(1.25, 1.25, 1.25)
const MARQUEE_BOOST = new THREE.Color(1.5, 1.5, 1.5)
const COIN_RED = new THREE.Color(3, 0.25, 0.3)

export default function Cabinet({
  position = [0, 0, 0],
  rotationY = 0,
  screen,
  marquee,
  accent,
  sideColor,
  featured = false,
  interactive,
  onActivate,
  onHover,
}: CabinetProps) {
  const [hovered, setHovered] = useState(false)
  const screenTexture = useAnimatedTexture(screen.width, screen.height, screen.draw, screen.fps)
  const marqueeTexture = useStaticTexture(1024, 256, (c, w, h) => paintMarquee(c, w, h, marquee, accent), [NEON_FONT])

  const materials = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({ color: '#121019', roughness: 0.55, metalness: 0.2 }),
      side: new THREE.MeshStandardMaterial({ color: sideColor, roughness: 0.45, metalness: 0.15 }),
      bezel: new THREE.MeshStandardMaterial({ color: '#040406', roughness: 0.25, metalness: 0.1 }),
    }),
    [sideColor],
  )
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials])

  const trimColor = useMemo(
    () => new THREE.Color(accent).multiplyScalar(hovered ? 6 : featured ? 3 : 1.6),
    [accent, hovered, featured],
  )

  const setHover = (next: boolean) => {
    setHovered(next)
    onHover?.(next)
    document.body.style.cursor = next ? 'pointer' : ''
  }

  // the room stops being clickable while the camera is moving; drop any hover state
  useEffect(() => {
    if (interactive || !hovered) return
    setHovered(false)
    onHover?.(false)
    document.body.style.cursor = ''
  }, [interactive, hovered, onHover])

  return (
    <group
      position={position}
      rotation-y={rotationY}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        if (!interactive) return
        e.stopPropagation()
        setHover(true)
      }}
      onPointerOut={() => hovered && setHover(false)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!interactive) return
        e.stopPropagation()
        onActivate()
      }}
    >
      <mesh geometry={SIDE_GEOMETRY} material={materials.side} position-x={W / 2 + SIDE_THICKNESS} rotation-y={-Math.PI / 2} />
      <mesh geometry={SIDE_GEOMETRY} material={materials.side} position-x={-W / 2} rotation-y={-Math.PI / 2} />
      <Line points={TRIM_RIGHT} color={trimColor} lineWidth={2.2} toneMapped={false} />
      <Line points={TRIM_LEFT} color={trimColor} lineWidth={2.2} toneMapped={false} />

      {EDGES.map((edge, i) => (
        <group key={i} position={edge.mid} rotation-x={edge.rx}>
          <mesh position-z={-PANEL_THICKNESS / 2} material={i === EDGE.bezel ? materials.bezel : materials.body}>
            <boxGeometry args={[W, edge.len, PANEL_THICKNESS]} />
          </mesh>

          {i === EDGE.kick && <CoinDoor />}
          {i === EDGE.controls && <Controls />}
          {i === EDGE.bezel && (
            <mesh position-z={SCREEN_OFFSET}>
              <planeGeometry args={[SCREEN_W, SCREEN_H]} />
              <meshBasicMaterial map={screenTexture} color={SCREEN_BOOST} toneMapped={false} />
            </mesh>
          )}
          {i === EDGE.marquee && (
            <mesh position-z={0.002}>
              <planeGeometry args={[W - 0.03, edge.len - 0.02]} />
              <meshBasicMaterial map={marqueeTexture} color={MARQUEE_BOOST} toneMapped={false} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

const BUTTONS: [x: number, z: number, color: string][] = [
  [-0.05, 0.05, '#ff4fa3'],
  [0.02, 0.06, '#5fe3ff'],
  [0.09, 0.05, '#ffd23f'],
  [-0.04, -0.015, '#ff4fa3'],
  [0.03, -0.005, '#5fe3ff'],
  [0.1, -0.015, '#ffd23f'],
]

/** Joystick and buttons. Inside this group +y points out of the control panel and +z toward the player. */
function Controls() {
  return (
    <group rotation-x={Math.PI / 2}>
      <mesh position={[-0.21, 0.004, 0.02]}>
        <cylinderGeometry args={[0.045, 0.05, 0.008, 24]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.3} />
      </mesh>
      <mesh position={[-0.21, 0.04, 0.02]}>
        <cylinderGeometry args={[0.007, 0.007, 0.07, 12]} />
        <meshStandardMaterial color="#c9c9d6" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[-0.21, 0.08, 0.02]}>
        <sphereGeometry args={[0.024, 24, 16]} />
        <meshStandardMaterial color="#e3263f" roughness={0.25} />
      </mesh>
      {BUTTONS.map(([x, z, color]) => (
        <mesh key={`${x}${z}`} position={[x, 0.006, z]}>
          <cylinderGeometry args={[0.021, 0.021, 0.012, 24]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      ))}
      {[-0.07, 0.07].map((x) => (
        <mesh key={x} position={[x + 0.02, 0.004, -0.11]}>
          <cylinderGeometry args={[0.012, 0.012, 0.008, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

function CoinDoor() {
  return (
    <group position-y={0.08}>
      <mesh position-z={0.006}>
        <boxGeometry args={[0.26, 0.32, 0.012]} />
        <meshStandardMaterial color="#1b1b22" metalness={0.7} roughness={0.35} />
      </mesh>
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, 0.07, 0.013]}>
          <planeGeometry args={[0.035, 0.06]} />
          <meshBasicMaterial color={COIN_RED} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

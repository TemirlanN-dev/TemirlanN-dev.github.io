import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import { useStaticTexture } from './textures'
import { paintNeon } from './screens'

const WALL_Z = -2.4

type NeonSignProps = {
  label: string
  family: string
  color: string
  position: [number, number, number]
  size: [number, number]
  boost: number
  flicker?: boolean
}

function NeonSign({ label, family, color, position, size, boost, flicker = false }: NeonSignProps) {
  const texture = useStaticTexture(1024, Math.round((1024 * size[1]) / size[0]), (c, w, h) => paintNeon(c, w, h, label, family, color), [
    `64px ${family}`,
  ])
  const material = useRef<THREE.MeshBasicMaterial>(null)
  const clock = useRef({ t: 0, next: 2 + Math.random() * 4, until: 0 })

  // every few seconds the tube stutters, like a real sign on its last legs
  useFrame((_, delta) => {
    if (!material.current) return
    const s = clock.current
    s.t += delta
    if (flicker && s.t > s.next) {
      s.until = s.t + 0.22
      s.next = s.t + 3 + Math.random() * 6
    }
    const dim = s.t < s.until && Math.sin(s.t * 80) > 0
    material.current.color.setScalar(dim ? boost * 0.2 : boost)
  })

  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshBasicMaterial ref={material} map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

function GlowBar({ position, size, color, intensity }: { position: [number, number, number]; size: [number, number, number]; color: string; intensity: number }) {
  const glow = useMemo(() => new THREE.Color(color).multiplyScalar(intensity), [color, intensity])
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshBasicMaterial color={glow} toneMapped={false} />
    </mesh>
  )
}

export default function Room({ lowPower }: { lowPower: boolean }) {
  // shrink the big sign on portrait screens so it stays inside the frame
  const aspect = useThree((s) => s.size.width / s.size.height)
  const signScale = Math.min(1, aspect / 0.95)

  return (
    <>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[40, 40]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={lowPower ? 256 : 512}
          mixBlur={1}
          mixStrength={lowPower ? 20 : 40}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#07060d"
          metalness={0.6}
          mirror={0}
        />
      </mesh>

      <mesh position={[0, 3, WALL_Z]}>
        <planeGeometry args={[24, 6]} />
        <meshStandardMaterial color="#0d0b18" roughness={0.95} />
      </mesh>

      <group position={[0, 2.75, WALL_Z + 0.02]} scale={signScale}>
        <NeonSign label="ARCADE" family="Monoton" color="#ff4fa3" position={[0, 0, 0]} size={[3.2, 0.8]} boost={2.2} flicker />
      </group>
      {/* high enough to clear the side cabinets from the resting camera */}
      <NeonSign label="OPEN 24/7" family="Monoton" color="#4de1ff" position={[2.55, 2.55, WALL_Z + 0.02]} size={[1.3, 0.32]} boost={2} />
      <NeonSign label="PLAYER 1" family="Monoton" color="#ffd23f" position={[-2.55, 2.55, WALL_Z + 0.02]} size={[1.3, 0.32]} boost={1.8} flicker />

      <GlowBar position={[0, 0.015, WALL_Z + 0.02]} size={[24, 0.03, 0.02]} color="#3dd8ff" intensity={2.5} />
      <GlowBar position={[-3.3, 1.8, WALL_Z + 0.02]} size={[0.04, 3.6, 0.02]} color="#ff3d9a" intensity={3} />
      <GlowBar position={[3.3, 1.8, WALL_Z + 0.02]} size={[0.04, 3.6, 0.02]} color="#ff3d9a" intensity={3} />
    </>
  )
}

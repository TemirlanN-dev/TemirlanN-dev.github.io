import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useMotion } from '../lib/motion'
import { sfx } from '../lib/sound'
import { ROOM, WINDOW } from './layout'
import { useStaticTexture } from './textures'
import { Block, Clickable, Part, Rod, Toon } from './toon'

const WALL = '#efe4d2'
const WOOD = '#8b5e3c'
const TRIM = '#b4865c'
const RAIL = '#e9eef4'

function paintPlanks(c: CanvasRenderingContext2D, w: number, h: number) {
  const rows = 8
  const tones = ['#c99f70', '#c19566', '#cfa676', '#bd9062']
  for (let r = 0; r < rows; r++) {
    const y = (r * h) / rows
    // planks in each row, offset so the seams stagger
    const offset = (r % 2) * (w / 3)
    for (let k = -1; k < 3; k++) {
      c.fillStyle = tones[(r + k + 4) % tones.length]
      c.fillRect(offset + (k * w) / 1.5, y, w / 1.5, h / rows)
      c.fillStyle = 'rgba(70, 40, 20, 0.55)'
      c.fillRect(offset + (k * w) / 1.5, y, 3, h / rows)
    }
    c.fillStyle = 'rgba(70, 40, 20, 0.55)'
    c.fillRect(0, y, w, 3)
    // a little grain
    c.fillStyle = 'rgba(90, 55, 25, 0.12)'
    for (let g = 0; g < 6; g++) c.fillRect(0, y + 8 + g * ((h / rows - 12) / 6), w, 1.5)
  }
}

function Floor() {
  const planks = useStaticTexture(512, 512, paintPlanks, [])
  useMemo(() => {
    planks.wrapS = planks.wrapT = THREE.RepeatWrapping
    planks.repeat.set(2.2, 2.2)
  }, [planks])

  const depth = ROOM.front - ROOM.back
  return (
    <>
      <Block size={[ROOM.halfWidth * 2 + 0.2, 0.05, depth]} position={[0, -0.025, (ROOM.front + ROOM.back) / 2]} color="#ffffff" map={planks} ink={false} />
      {/* round rug in front of the desk */}
      <Part position={[0.1, 0.006, 0.45]} color="#bcd7ee" shape={<cylinderGeometry args={[0.95, 0.95, 0.012, 48]} />} />
      <Part position={[0.1, 0.008, 0.45]} color="#a3c6e6" ink={false} shape={<cylinderGeometry args={[0.72, 0.72, 0.012, 48]} />} />
    </>
  )
}

function Walls() {
  const { halfWidth: hw, back, front, height } = ROOM
  const z = back - 0.05
  const depth = front - back
  const sideZ = (front + back) / 2
  const { left, right, bottom, top } = WINDOW
  return (
    <>
      {/* back wall, built around the window opening */}
      <Block size={[hw * 2, bottom, 0.1]} position={[0, bottom / 2, z]} color={WALL} />
      <Block size={[hw * 2, height - top, 0.1]} position={[0, (height + top) / 2, z]} color={WALL} />
      <Block size={[hw + left, top - bottom, 0.1]} position={[(-hw + left) / 2, (top + bottom) / 2, z]} color={WALL} />
      <Block size={[hw - right, top - bottom, 0.1]} position={[(hw + right) / 2, (top + bottom) / 2, z]} color={WALL} />
      {/* side walls and ceiling */}
      <Block size={[0.1, height, depth]} position={[-hw - 0.05, height / 2, sideZ]} color={WALL} />
      <Block size={[0.1, height, depth]} position={[hw + 0.05, height / 2, sideZ]} color={WALL} />
      <Block size={[hw * 2 + 0.2, 0.05, depth]} position={[0, height + 0.025, sideZ]} color={WALL} ink={false} />
      {/* skirting boards */}
      <Block size={[hw * 2, 0.08, 0.02]} position={[0, 0.04, back + 0.01]} color={TRIM} />
      <Block size={[0.02, 0.08, depth]} position={[-hw + 0.01, 0.04, sideZ]} color={TRIM} />
      <Block size={[0.02, 0.08, depth]} position={[hw - 0.01, 0.04, sideZ]} color={TRIM} />
    </>
  )
}

function WindowFrame() {
  const { left, right, bottom, top, transom } = WINDOW
  const width = right - left
  const z = ROOM.back - 0.05
  const slats = Array.from({ length: 13 }, (_, i) => left + 0.15 + (i * (width - 0.3)) / 12)
  return (
    <>
      <Block size={[width + 0.06, 0.06, 0.13]} position={[0, top - 0.03, z]} color={WOOD} />
      <Block size={[width + 0.06, 0.05, 0.13]} position={[0, bottom + 0.025, z]} color={WOOD} />
      <Block size={[0.06, top - bottom, 0.13]} position={[left + 0.03, (top + bottom) / 2, z]} color={WOOD} />
      <Block size={[0.06, top - bottom, 0.13]} position={[right - 0.03, (top + bottom) / 2, z]} color={WOOD} />
      {/* sill board reaching into the room */}
      <Block size={[width + 0.24, 0.04, 0.2]} position={[0, bottom - 0.01, ROOM.back + 0.06]} color={TRIM} />
      {/* sliding panes meet in the middle; a transom with a lattice (ranma) above */}
      <Block size={[0.05, transom - bottom, 0.08]} position={[0, (transom + bottom) / 2, z]} color={WOOD} />
      <Block size={[width, 0.05, 0.1]} position={[0, transom, z]} color={WOOD} />
      <Block size={[width, 0.022, 0.04]} position={[0, (transom + top) / 2, z]} color={WOOD} />
      {slats.map((x) => (
        <Block key={x} size={[0.022, top - transom - 0.06, 0.04]} position={[x, (transom + top) / 2, z]} color={WOOD} />
      ))}
    </>
  )
}

/** The balcony railing outside; the sun throws its stripes into the room. */
function Railing() {
  const z = ROOM.back - 0.8
  const posts = Array.from({ length: 35 }, (_, i) => -2.4 + i * 0.14)
  return (
    <>
      <Block size={[5, 0.05, 0.06]} position={[0, 1.14, z]} color={RAIL} />
      <Block size={[5, 0.04, 0.05]} position={[0, 0.5, z]} color={RAIL} />
      {posts.map((x) => (
        <Block key={x} size={[0.025, 0.64, 0.025]} position={[x, 0.82, z]} color={RAIL} />
      ))}
    </>
  )
}

/** A sheer curtain: folds baked into the geometry, swaying in the breeze when motion is on. */
function Curtain({ x }: { x: number }) {
  const motion = useMotion()
  const width = 0.55
  const height = 1.58
  const { geometry, base } = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, height, 18, 14)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 40) * 0.022)
    g.computeVertexNormals()
    return { geometry: g, base: Float32Array.from(p.array) }
  }, [])

  useFrame(({ clock }) => {
    if (!motion) return
    const t = clock.elapsedTime
    const p = geometry.attributes.position
    for (let i = 0; i < p.count; i++) {
      const bx = base[i * 3]
      const by = base[i * 3 + 1]
      const hang = (height / 2 - by) / height // 0 at the rod, 1 at the hem
      const breeze = (Math.sin(t * 1.1 + by * 2.2 + bx * 3 + x) * 0.05 + Math.sin(t * 0.6 + x) * 0.035) * hang * hang
      p.setZ(i, base[i * 3 + 2] + breeze)
    }
    p.needsUpdate = true
    geometry.computeVertexNormals()
  })

  return (
    <mesh geometry={geometry} position={[x, 2.45 - height / 2, ROOM.back + 0.13]} castShadow receiveShadow>
      <Toon color="#f7f3ea" side={THREE.DoubleSide} transparent opacity={0.93} />
    </mesh>
  )
}

/** A glass fūrin hanging in the window. Click it to ring it. */
function WindChime({ enabled }: { enabled: boolean }) {
  const motion = useMotion()
  const clock = useThree((s) => s.clock)
  const swing = useRef<THREE.Group>(null)
  const struck = useRef(-10)

  useFrame(({ clock }) => {
    if (!swing.current) return
    const t = clock.elapsedTime
    const kick = Math.exp(-(t - struck.current) * 1.4) * 0.35
    const breeze = motion ? 0.07 : 0
    swing.current.rotation.z = Math.sin(t * 1.3) * breeze + Math.sin((t - struck.current) * 7) * kick
    swing.current.rotation.x = Math.sin(t * 0.9 + 1) * breeze * 0.5
  })

  return (
    <Clickable
      enabled={enabled}
      position={[-0.62, WINDOW.top - 0.06, ROOM.back + 0.08]}
      onClick={() => {
        struck.current = clock.elapsedTime
        sfx.chime()
      }}
    >
      <group ref={swing}>
        <Rod from={[0, 0, 0]} to={[0, -0.13, 0]} radius={0.003} color="#cfd6e6" ink={false} />
        <mesh position={[0, -0.13, 0]} castShadow>
          <sphereGeometry args={[0.05, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <Toon color="#bfe6ff" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
        <Part position={[0, -0.13, 0.049]} color="#e5232e" ink={false} shape={<circleGeometry args={[0.012, 12]} />} />
        <Rod from={[0, -0.13, 0]} to={[0, -0.27, 0]} radius={0.002} color="#cfd6e6" ink={false} />
        <Part position={[0, -0.19, 0]} color="#e5232e" shape={<cylinderGeometry args={[0.008, 0.008, 0.03, 8]} />} />
        <Block size={[0.04, 0.15, 0.004]} position={[0, -0.34, 0]} color="#ffd3e4" />
      </group>
    </Clickable>
  )
}

export default function Room({ interactive }: { interactive: boolean }) {
  return (
    <>
      <Floor />
      <Walls />
      <WindowFrame />
      <Railing />
      <Rod from={[-1.75, 2.47, ROOM.back + 0.13]} to={[1.75, 2.47, ROOM.back + 0.13]} radius={0.014} color={WOOD} />
      <Curtain x={-1.2} />
      <Curtain x={1.2} />
      <WindChime enabled={interactive} />
    </>
  )
}

import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useMotion } from '../lib/motion'
import { Ink, Part, Rod, Toon } from './toon'

// Small objects that dress the room: books built like books, and an alarm clock that tells
// the real time.

const PAGES = '#f3ead2'

// ---------- books ----------

/** A box with every vertex coloured `color`, so several can be merged into one mesh. */
function colouredBox(size: THREE.Vector3Tuple, at: THREE.Vector3Tuple, color: THREE.ColorRepresentation) {
  const g = new THREE.BoxGeometry(...size)
  g.translate(...at)
  const c = new THREE.Color(color)
  const colors = new Float32Array(g.attributes.position.count * 3)
  for (let i = 0; i < colors.length; i += 3) colors.set([c.r, c.g, c.b], i)
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return g
}

type BookShape = { thickness: number; height: number; depth: number; color: string; accent: string; label: string }

/**
 * A standing book: thickness along x, height along y, spine facing +z. Two cover boards, a
 * page block set back inside them, the spine, and a title label and bands on the spine.
 * Merged into one geometry (vertex coloured) so a whole book is a single draw call.
 */
function bookGeometry({ thickness: T, height: H, depth: D, color, accent, label }: BookShape) {
  const board = 0.003
  const inset = 0.004 // the pages sit this far inside the covers
  const spineZ = D / 2 - board / 2
  const parts = [
    colouredBox([board, H, D], [-(T / 2 - board / 2), 0, 0], color),
    colouredBox([board, H, D], [T / 2 - board / 2, 0, 0], color),
    colouredBox([T, H, board], [0, 0, spineZ], color),
    colouredBox([T - 2 * board, H - 2 * inset, D - board - inset], [0, 0, -(inset - board) / 2 - board / 2], PAGES),
    colouredBox([T * 0.62, H * 0.34, 0.0012], [0, H * 0.06, D / 2 + 0.0004], label),
    colouredBox([T + 0.0006, 0.005, 0.0014], [0, H * 0.38, D / 2 + 0.0003], accent),
    colouredBox([T + 0.0006, 0.005, 0.0014], [0, -H * 0.38, D / 2 + 0.0003], accent),
  ]
  const merged = mergeGeometries(parts)!
  parts.forEach((p) => p.dispose())
  return merged
}

type BookProps = Partial<Pick<BookShape, 'accent' | 'label'>> &
  Omit<BookShape, 'accent' | 'label'> & { position: THREE.Vector3Tuple; rotation?: [number, number, number] }

export function Book({ thickness, height, depth, color, accent = '#f2c14e', label = '#f6efdc', position, rotation }: BookProps) {
  const geometry = useMemo(() => bookGeometry({ thickness, height, depth, color, accent, label }), [thickness, height, depth, color, accent, label])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh geometry={geometry} position={position} rotation={rotation} castShadow receiveShadow>
      <Toon color="#ffffff" vertexColors />
      <Ink />
    </mesh>
  )
}

// ---------- alarm clock ----------

const SILVER = '#c9ced9'
const INK_DARK = '#1d1830'

/** One hand, pivoting at the centre of the face. */
function Hand({ length, width, color, z, hand }: { length: number; width: number; color: string; z: number; hand: React.RefObject<THREE.Group | null> }) {
  return (
    <group ref={hand} position={[0, 0, z]}>
      <mesh position={[0, length / 2 - 0.004, 0]}>
        <boxGeometry args={[width, length, 0.0015]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

/** A retro twin-bell alarm clock whose hands show the visitor's real local time. Faces +z. */
export function AlarmClock({ position, rotation, color = '#3d6df2' }: { position: THREE.Vector3Tuple; rotation?: [number, number, number]; color?: string }) {
  const motion = useMotion()
  const hour = useRef<THREE.Group>(null)
  const minute = useRef<THREE.Group>(null)
  const second = useRef<THREE.Group>(null)

  useFrame(() => {
    const now = new Date()
    const s = now.getSeconds()
    const m = now.getMinutes() + s / 60
    const h = (now.getHours() % 12) + m / 60
    if (hour.current) hour.current.rotation.z = -(h / 12) * Math.PI * 2
    if (minute.current) minute.current.rotation.z = -(m / 60) * Math.PI * 2
    // the second hand ticks only while motion is on
    if (second.current) {
      second.current.visible = motion
      second.current.rotation.z = -(s / 60) * Math.PI * 2
    }
  })

  const R = 0.052
  const depth = 0.034
  const front = depth / 2
  return (
    <group position={position} rotation={rotation}>
      <group position={[0, R + 0.018, 0]}>
        {/* body, rim and face */}
        <Part rotation={[Math.PI / 2, 0, 0]} color={color} shape={<cylinderGeometry args={[R, R, depth, 10]} />} />
        <Part position={[0, 0, front]} color={SILVER} ink={false} castShadow={false} shape={<torusGeometry args={[R - 0.004, 0.004, 4, 10]} />} />
        <mesh position={[0, 0, front + 0.0005]}>
          <circleGeometry args={[R - 0.008, 20]} />
          <Toon color="#fbf8f0" />
        </mesh>
        {/* hour marks at 12, 3, 6 and 9 */}
        {[0, 1, 2, 3].map((q) => (
          <mesh key={q} position={[Math.sin((q * Math.PI) / 2) * 0.034, Math.cos((q * Math.PI) / 2) * 0.034, front + 0.001]} rotation={[0, 0, (-q * Math.PI) / 2]}>
            <boxGeometry args={[0.0035, 0.008, 0.001]} />
            <meshBasicMaterial color={INK_DARK} />
          </mesh>
        ))}
        <Hand hand={hour} length={0.026} width={0.0042} color={INK_DARK} z={front + 0.0015} />
        <Hand hand={minute} length={0.037} width={0.003} color={INK_DARK} z={front + 0.0025} />
        <Hand hand={second} length={0.04} width={0.0012} color="#e5232e" z={front + 0.0035} />
        <mesh position={[0, 0, front + 0.004]}>
          <circleGeometry args={[0.003, 8]} />
          <meshBasicMaterial color={INK_DARK} />
        </mesh>

        {/* twin bells with the hammer between them, and a carry handle */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.032, R - 0.004, -0.004]} rotation={[0, 0, -side * 0.55]}>
            <Part color={SILVER} shape={<sphereGeometry args={[0.022, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />} />
            <Part position={[0, 0.022, 0]} color={SILVER} ink={false} castShadow={false} shape={<cylinderGeometry args={[0.004, 0.004, 0.006, 6]} />} />
          </group>
        ))}
        <Rod from={[0, R - 0.002, -0.004]} to={[0, R + 0.018, -0.004]} radius={0.0025} color={SILVER} ink={false} />
        <Part position={[0, R + 0.004, -0.012]} color={SILVER} shape={<torusGeometry args={[0.03, 0.0035, 4, 9, Math.PI]} />} />
      </group>
      {/* little splayed feet */}
      {[-1, 1].map((side) => (
        <Rod key={side} from={[side * 0.028, 0.026, 0]} to={[side * 0.04, 0, 0.004]} radius={0.004} color={SILVER} />
      ))}
    </group>
  )
}

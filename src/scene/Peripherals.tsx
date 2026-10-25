import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { DESK_TOP } from './layout'
import { useStaticTexture } from './textures'
import { Block, Part, Rod, Toon } from './toon'

// The things you actually use at the desk: a desk mat, a compact mechanical keyboard with
// real keycaps, a mouse, and headphones hanging on a stand. Low-poly, like the rest of the room.

const BLUE = '#3d6df2'
const RED = '#e5232e'
const SHELL = '#f3f4f8'
const CHARCOAL = '#30333f'

// ---------- desk mat ----------

/** Seigaiha, the traditional Japanese wave pattern: overlapping rows of concentric arcs. */
function paintSeigaiha(c: CanvasRenderingContext2D, w: number, h: number) {
  const bg = '#2c4fc4'
  const line = '#9cc0ff'
  const r = 46
  c.fillStyle = bg
  c.fillRect(0, 0, w, h)
  c.lineWidth = 5
  // top to bottom, so each row's discs cover the lower half of the row above
  for (let row = 0, y = -r; y < h + r; row++, y += r / 2) {
    for (let x = (row % 2) * r - r; x < w + r * 2; x += r * 2) {
      c.fillStyle = bg
      c.beginPath()
      c.arc(x, y, r, 0, Math.PI * 2)
      c.fill()
      c.strokeStyle = line
      for (const k of [1, 0.68, 0.36]) {
        c.beginPath()
        c.arc(x, y, r * k, Math.PI, 0)
        c.stroke()
      }
    }
  }
  // stitched edge
  c.strokeStyle = 'rgba(255, 255, 255, 0.55)'
  c.lineWidth = 2
  c.setLineDash([6, 5])
  c.strokeRect(7, 7, w - 14, h - 14)
}

function DeskMat() {
  const pattern = useStaticTexture(640, 280, paintSeigaiha, [])
  return <Block size={[0.66, 0.004, 0.29]} position={[0.07, DESK_TOP + 0.002, -0.62]} color="#ffffff" map={pattern} />
}

// ---------- keyboard ----------

type KeyKind = 'alpha' | 'mod' | 'esc' | 'enter'
type Key = [width: number, kind: KeyKind]

const alphas = (n: number): Key[] => Array.from({ length: n }, () => [1, 'alpha'])

/** A 60% layout, front row last; every row is 15 units wide. */
const LAYOUT: Key[][] = [
  [[1, 'esc'], ...alphas(12), [2, 'mod']],
  [[1.5, 'mod'], ...alphas(12), [1.5, 'mod']],
  [[1.75, 'mod'], ...alphas(11), [2.25, 'enter']],
  [[2.25, 'mod'], ...alphas(10), [2.75, 'mod']],
  [[1.25, 'mod'], [1.25, 'mod'], [1.25, 'mod'], [6.25, 'alpha'], [1.25, 'mod'], [1.25, 'mod'], [1.25, 'mod'], [1.25, 'mod']],
]

const KEY_COLORS: Record<KeyKind, string> = { alpha: '#f6f2e9', mod: '#bccbea', esc: RED, enter: BLUE }

const U = 0.0185 // one key unit, as on a real keyboard (19 mm pitch)
const GAP = 0.0022
const CAP_HEIGHT = 0.011
const CASE = { width: 15 * U + 0.013, depth: 5 * U + 0.013, height: 0.017 }

/** A keycap: a square frustum (wider at the base) with its base at y = 0 and a 1 × 1 footprint. */
const KEYCAP = (() => {
  const g = new THREE.CylinderGeometry(0.8 * Math.SQRT1_2, Math.SQRT1_2, 1, 4, 1)
  g.rotateY(Math.PI / 4)
  g.translate(0, 0.5, 0)
  return g
})()

function Keyboard() {
  const caps = useRef<THREE.InstancedMesh>(null)
  const keys = useMemo(() => {
    const out: { x: number; z: number; width: number; color: THREE.Color }[] = []
    LAYOUT.forEach((row, r) => {
      let x = -7.5 * U
      for (const [width, kind] of row) {
        out.push({ x: x + (width * U) / 2, z: (r - 2) * U, width, color: new THREE.Color(KEY_COLORS[kind]) })
        x += width * U
      }
    })
    return out
  }, [])

  useLayoutEffect(() => {
    const mesh = caps.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    keys.forEach((k, i) => {
      m.compose(new THREE.Vector3(k.x, CASE.height, k.z), new THREE.Quaternion(), new THREE.Vector3(k.width * U - GAP, CAP_HEIGHT, U - GAP))
      mesh.setMatrixAt(i, m)
      mesh.setColorAt(i, k.color)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [keys])

  // a touch of typing angle: the back edge sits higher, and it's turned slightly toward the user's left hand
  return (
    <group position={[-0.07, DESK_TOP + 0.004, -0.6]} rotation={[-0.07, 0.04, 0]}>
      <Block size={[CASE.width, CASE.height, CASE.depth]} position={[0, CASE.height / 2, 0]} color={CHARCOAL} />
      {/* recessed plate the keys sit in */}
      <Block size={[CASE.width - 0.008, 0.002, CASE.depth - 0.008]} position={[0, CASE.height + 0.0005, 0]} color="#1f2129" ink={false} castShadow={false} />
      <instancedMesh ref={caps} args={[KEYCAP, undefined, keys.length]} castShadow receiveShadow>
        {/* no ink per key: at this size outlines would bury the caps */}
        <Toon color="#ffffff" />
      </instancedMesh>
      {/* status LED */}
      <mesh position={[CASE.width / 2 - 0.012, CASE.height + 0.001, -CASE.depth / 2 + 0.004]}>
        <boxGeometry args={[0.004, 0.0015, 0.002]} />
        <meshBasicMaterial color={new THREE.Color(0.4, 2.4, 3)} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ---------- mouse ----------

function Mouse() {
  // body is the top half of a stretched sphere; front (the buttons) faces the monitor (-z)
  const L = 0.052
  const W = 0.031
  const H = 0.021
  const heightAt = (z: number) => H * Math.sqrt(Math.max(0, 1 - (z / L) ** 2))
  // tilt that follows the dome's slope at z, for pieces lying along the top
  const tiltAt = (z: number) => -Math.atan((-H * z) / (L * L * Math.sqrt(1 - (z / L) ** 2)))
  return (
    <group position={[0.26, DESK_TOP + 0.004, -0.58]} rotation={[0, -0.18, 0]}>
      <Part scale={[W, H, L]} color={SHELL} shape={<sphereGeometry args={[1, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />} />
      {/* the split between the two buttons, running from the front edge to the wheel */}
      {[-0.042, -0.03, -0.018].map((z) => (
        <Block key={z} size={[0.0016, 0.003, 0.0125]} position={[0, heightAt(z) - 0.0006, z]} rotation={[tiltAt(z), 0, 0]} color={CHARCOAL} ink={false} castShadow={false} />
      ))}
      {/* scroll wheel */}
      <Part position={[0, heightAt(-0.02) + 0.0008, -0.02]} rotation={[0, 0, Math.PI / 2]} color={BLUE} castShadow={false} shape={<cylinderGeometry args={[0.0062, 0.0062, 0.0045, 8]} />} />
      {/* a thin blue stripe around the base */}
      <Part position={[0, 0.0012, 0]} scale={[W * 1.01, 1, L * 1.01]} color={BLUE} ink={false} castShadow={false} shape={<cylinderGeometry args={[1, 1, 0.0024, 10]} />} />
    </group>
  )
}

// ---------- headphones on a stand ----------

const STAND_TOP = 0.215

function Headphones() {
  const R = 0.074 // headband radius
  const tube = 0.008
  const barTop = STAND_TOP + 0.006
  const cy = barTop - R + tube // headband centre: its inside rests on the stand's bar
  const cupY = cy - 0.052
  return (
    <group position={[0.6, DESK_TOP, -0.74]} rotation={[0, -0.4, 0]}>
      {/* stand: weighted base, post, and a padded bar on top */}
      <Part position={[0, 0.007, 0]} color={CHARCOAL} shape={<cylinderGeometry args={[0.052, 0.058, 0.014, 8]} />} />
      <Part position={[0, (0.014 + STAND_TOP) / 2, 0]} color={CHARCOAL} shape={<cylinderGeometry args={[0.0075, 0.0075, STAND_TOP - 0.014, 6]} />} />
      <Block size={[0.03, 0.012, 0.026]} position={[0, STAND_TOP, 0]} color={CHARCOAL} />

      {/* headband: a half ring, with a soft pad along the top inside */}
      <Part position={[0, cy, 0]} color={CHARCOAL} shape={<torusGeometry args={[R, tube, 5, 12, Math.PI]} />} />
      <Part position={[0, cy, 0]} rotation={[0, 0, (Math.PI - 1.5) / 2]} color="#f6f2e9" ink={false} castShadow={false} shape={<torusGeometry args={[R - 0.011, 0.0085, 5, 8, 1.5]} />} />

      {[-1, 1].map((side) => (
        <group key={side}>
          {/* sliding yoke */}
          <Rod from={[side * R, cy + 0.004, 0]} to={[side * R, cupY + 0.03, 0]} radius={0.0035} color="#b9bfcc" ink={false} />
          <group position={[side * (R + 0.002), cupY, 0]} rotation={[0, 0, Math.PI / 2]}>
            {/* earcup shell, cushion on the inside, blue plate on the outside */}
            <Part color={SHELL} shape={<cylinderGeometry args={[0.038, 0.038, 0.026, 10]} />} />
            <Part position={[0, -side * 0.016, 0]} rotation={[Math.PI / 2, 0, 0]} color={CHARCOAL} ink={false} castShadow={false} shape={<torusGeometry args={[0.027, 0.0105, 5, 10]} />} />
            <Part position={[0, side * 0.0145, 0]} color={BLUE} ink={false} castShadow={false} shape={<cylinderGeometry args={[0.028, 0.028, 0.004, 10]} />} />
          </group>
        </group>
      ))}
    </group>
  )
}

export default function Peripherals() {
  return (
    <>
      <DeskMat />
      <Keyboard />
      <Mouse />
      <Headphones />
    </>
  )
}

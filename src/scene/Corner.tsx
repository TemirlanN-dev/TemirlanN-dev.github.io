import { useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useMotion } from '../lib/motion'
import { sfx } from '../lib/sound'
import { ROOM } from './layout'
import { useSceneTime } from './sceneTime'
import { useStaticTexture } from './textures'
import { Block, Clickable, Part, Toon } from './toon'

const WOOD = '#d9b48a'
const BLUE = '#3d6df2'
const RED = '#e5232e'
const NOTE_FONT = '"Barlow Condensed", sans-serif'
const WALL_Z = ROOM.back + 0.012

// ---------- wall decorations ----------

const NOTES: [text: string[], color: string, x: number, y: number, tilt: number][] = [
  [['cassette', 'v0.2.0 shipped!'], '#fff27a', 40, 40, -0.06],
  [['Ante', '363 tests ✓'], '#ffb3d1', 270, 34, 0.05],
  [['Tiptap', 'PR #8532'], '#9fe0ff', 46, 196, 0.04],
  [['learn Go', 'done-ish'], '#b8f5a8', 280, 200, -0.05],
]

function paintCorkboard(c: CanvasRenderingContext2D, w: number, h: number) {
  c.fillStyle = '#c98f55'
  c.fillRect(0, 0, w, h)
  for (let i = 0; i < 900; i++) {
    c.fillStyle = i % 2 ? 'rgba(120, 70, 30, 0.25)' : 'rgba(240, 200, 150, 0.25)'
    c.fillRect((i * 97.3) % w, (i * 53.9) % h, 3, 3)
  }
  for (const [lines, color, x, y, tilt] of NOTES) {
    c.save()
    c.translate(x + 95, y + 75)
    c.rotate(tilt)
    c.fillStyle = 'rgba(0, 0, 0, 0.18)'
    c.fillRect(-89, -69, 190, 150)
    c.fillStyle = color
    c.fillRect(-95, -75, 190, 150)
    c.fillStyle = '#2a2c36'
    c.textAlign = 'center'
    c.font = `italic 700 44px ${NOTE_FONT}`
    c.fillText(lines[0], 0, -8)
    c.font = `italic 500 32px ${NOTE_FONT}`
    c.fillText(lines[1], 0, 36)
    c.fillStyle = RED
    c.beginPath()
    c.arc(0, -60, 9, 0, Math.PI * 2)
    c.fill()
    c.restore()
  }
}

function paintCalendar(c: CanvasRenderingContext2D, w: number, h: number) {
  const today = new Date()
  c.fillStyle = '#fbf8f2'
  c.fillRect(0, 0, w, h)
  // picture half: a stylised wave over the sea
  const top = h * 0.42
  c.fillStyle = '#9fd2ff'
  c.fillRect(0, 0, w, top)
  c.fillStyle = BLUE
  c.beginPath()
  c.moveTo(0, top)
  c.bezierCurveTo(w * 0.15, top * 0.35, w * 0.55, top * 0.1, w * 0.62, top * 0.45)
  c.bezierCurveTo(w * 0.5, top * 0.35, w * 0.42, top * 0.6, w * 0.6, top * 0.72)
  c.bezierCurveTo(w * 0.8, top * 0.8, w * 0.9, top * 0.7, w, top * 0.75)
  c.lineTo(w, top)
  c.fill()
  c.fillStyle = '#ffffff'
  for (let i = 0; i < 6; i++) {
    c.beginPath()
    c.arc(w * (0.42 + i * 0.04), top * (0.3 + (i % 2) * 0.05), 7, 0, Math.PI * 2)
    c.fill()
  }
  // month header and day grid, today circled
  c.fillStyle = RED
  c.fillRect(0, top, w, 44)
  c.fillStyle = '#ffffff'
  c.font = `italic 800 34px ${NOTE_FONT}`
  c.textAlign = 'center'
  c.fillText(today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase(), w / 2, top + 33)
  const first = new Date(today.getFullYear(), today.getMonth(), 1).getDay()
  const days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const cw = w / 7
  const ch = (h - top - 60) / 6
  c.font = `600 22px ${NOTE_FONT}`
  for (let d = 1; d <= days; d++) {
    const slot = first + d - 1
    const cx = (slot % 7) * cw + cw / 2
    const cy = top + 74 + Math.floor(slot / 7) * ch
    if (d === today.getDate()) {
      c.strokeStyle = RED
      c.lineWidth = 4
      c.beginPath()
      c.arc(cx, cy - 7, 17, 0, Math.PI * 2)
      c.stroke()
    }
    c.fillStyle = slot % 7 === 0 ? RED : slot % 7 === 6 ? BLUE : '#2a2c36'
    c.fillText(String(d), cx, cy)
  }
}

function WallDecor() {
  const cork = useStaticTexture(512, 384, paintCorkboard, [`italic 700 44px ${NOTE_FONT}`])
  const calendar = useStaticTexture(384, 512, paintCalendar, [`italic 800 34px ${NOTE_FONT}`])
  return (
    <>
      <Block size={[0.66, 0.5, 0.025]} position={[-1.84, 1.72, WALL_Z]} color="#8b5e3c" />
      <mesh position={[-1.84, 1.72, WALL_Z + 0.014]}>
        <planeGeometry args={[0.6, 0.45]} />
        <Toon color="#ffffff" map={cork} />
      </mesh>
      <Block size={[0.4, 0.54, 0.012]} position={[1.84, 1.68, WALL_Z]} color="#fbf8f2" />
      <mesh position={[1.84, 1.68, WALL_Z + 0.007]}>
        <planeGeometry args={[0.39, 0.52]} />
        <Toon color="#ffffff" map={calendar} />
      </mesh>
      <Part position={[1.84, 1.97, WALL_Z + 0.01]} color={RED} shape={<sphereGeometry args={[0.012, 7, 5]} />} />
    </>
  )
}

// ---------- furniture ----------

function Bookshelf() {
  const books: [h: number, color: string][] = [
    [0.22, BLUE],
    [0.2, '#f2c14e'],
    [0.24, RED],
    [0.18, '#5bb36a'],
    [0.21, '#f1eee8'],
    [0.23, '#7b61d9'],
  ]
  const top = 0.82
  return (
    <group position={[-1.86, 0, ROOM.back + 0.17]}>
      <Block size={[0.76, top, 0.32]} position={[0, top / 2, 0]} color={WOOD} />
      <Block size={[0.68, 0.33, 0.02]} position={[0, 0.22, 0.155]} color="#b4865c" ink={false} />
      <Block size={[0.68, 0.33, 0.02]} position={[0, 0.6, 0.155]} color="#b4865c" ink={false} />
      {books.map(([h, color], i) => (
        <Block key={color} size={[0.045, h, 0.17]} position={[-0.3 + i * 0.05, top + h / 2, -0.02]} color={color} rotation={[0, 0, i === 5 ? -0.2 : 0]} />
      ))}
      <Daruma position={[0.18, top, 0.02]} />
      <Part position={[0.3, top + 0.045, 0.02]} color="#e8e2d6" shape={<cylinderGeometry args={[0.04, 0.032, 0.09, 7]} />} />
      <Part position={[0.3, top + 0.12, 0.02]} scale={[0.03, 0.06, 0.03]} color="#5bb36a" shape={<sphereGeometry args={[1, 7, 5]} />} />
    </group>
  )
}

/** A daruma: red body, white face, one eye filled in (a wish in progress). */
function Daruma(props: { position: THREE.Vector3Tuple }) {
  return (
    <group {...props}>
      <Part position={[0, 0.075, 0]} scale={[0.07, 0.078, 0.065]} color={RED} shape={<sphereGeometry args={[1, 7, 5]} />} />
      <Part position={[0.01, 0.09, 0.048]} scale={[0.045, 0.04, 0.025]} color="#fff6ea" ink={false} shape={<sphereGeometry args={[1, 7, 5]} />} />
      <Part position={[-0.006, 0.095, 0.072]} color="#1d1830" ink={false} shape={<sphereGeometry args={[0.008, 7, 5]} />} />
    </group>
  )
}

function FloorPlant() {
  const leaves = Array.from({ length: 9 }, (_, i) => ({
    a: i * 2.4,
    y: 0.45 + i * 0.07,
    tilt: 0.5 + (i % 3) * 0.15,
    color: i % 2 ? '#4f9e5f' : '#6cbf73',
  }))
  return (
    <group position={[-1.18, 0, -0.95]}>
      <Part position={[0, 0.15, 0]} color="#e8e2d6" shape={<cylinderGeometry args={[0.13, 0.1, 0.3, 7]} />} />
      {leaves.map(({ a, y, tilt, color }) => (
        <group key={a} position={[0, y, 0]} rotation={[0, a, 0]}>
          <Part position={[0, 0, 0.12]} rotation={[tilt, 0, 0]} scale={[0.09, 0.012, 0.15]} color={color} shape={<sphereGeometry args={[1, 7, 5]} />} />
        </group>
      ))}
      <Part position={[0, 0.5, 0]} color="#4f7f4a" shape={<cylinderGeometry args={[0.01, 0.012, 0.5, 7]} />} />
    </group>
  )
}

const BED = { x: ROOM.halfWidth - 0.55, head: ROOM.back + 0.08, foot: 0.97, mattressTop: 0.46 }
const BED_WOOD = '#b4865c'
const BED_DARK = '#8b5e3c'

/** A low wooden bed against the right wall: legs, frame, slatted headboard and footboard. */
function Bed() {
  const { x, head, foot, mattressTop } = BED
  const length = foot - head
  const mid = (head + foot) / 2
  const legs: [number, number][] = [
    [x - 0.47, head + 0.06],
    [x + 0.47, head + 0.06],
    [x - 0.47, foot - 0.06],
    [x + 0.47, foot - 0.06],
  ]
  const slats = [-0.3, -0.1, 0.1, 0.3]
  return (
    <group>
      {legs.map(([lx, lz]) => (
        <Block key={`${lx}${lz}`} size={[0.07, 0.1, 0.07]} position={[lx, 0.05, lz]} color={BED_DARK} />
      ))}
      <Block size={[1.02, 0.2, length - 0.04]} position={[x, 0.2, mid]} color={BED_WOOD} />
      <Block size={[0.94, 0.16, length - 0.12]} position={[x, mattressTop - 0.08, mid + 0.02]} color="#f5f2ec" />
      {/* duvet, its turned-down top edge, and a pillow */}
      <Block size={[0.98, 0.05, 1.32]} position={[x, mattressTop + 0.02, foot - 0.74]} color={BLUE} />
      <Block size={[0.98, 0.056, 0.13]} position={[x, mattressTop + 0.024, foot - 1.42]} color="#e8edf8" />
      <Part position={[x, mattressTop + 0.05, head + 0.25]} scale={[0.3, 0.06, 0.16]} color="#ffffff" shape={<sphereGeometry args={[1, 7, 5]} />} />
      {/* headboard: two posts, a top rail and slats */}
      {[-0.5, 0.5].map((dx) => (
        <Block key={dx} size={[0.07, 0.86, 0.07]} position={[x + dx, 0.43, head]} color={BED_DARK} />
      ))}
      <Block size={[1.08, 0.07, 0.09]} position={[x, 0.86, head]} color={BED_DARK} />
      <Block size={[0.96, 0.05, 0.04]} position={[x, 0.55, head]} color={BED_WOOD} />
      {slats.map((dx) => (
        <Block key={dx} size={[0.08, 0.3, 0.03]} position={[x + dx, 0.71, head]} color={BED_WOOD} />
      ))}
      {/* low footboard */}
      {[-0.5, 0.5].map((dx) => (
        <Block key={dx} size={[0.07, 0.56, 0.07]} position={[x + dx, 0.28, foot]} color={BED_DARK} />
      ))}
      <Block size={[1.0, 0.24, 0.04]} position={[x, 0.42, foot]} color={BED_WOOD} />
      <Block size={[1.08, 0.05, 0.08]} position={[x, 0.56, foot]} color={BED_DARK} />
      {/* a floor cushion on the rug */}
      <Block size={[0.48, 0.06, 0.48]} position={[-0.5, 0.04, 0.75]} rotation={[0, 0.3, 0]} color={RED} />
    </group>
  )
}

// what the cat thinks of being clicked, by click count; past the last one it blows up
const CAT_MOODS: [clicks: number, message: string][] = [
  [1, 'The cat opens one eye, decides you are fine, and goes back to sleep.'],
  [4, 'The cat flicks its tail. A warning.'],
  [7, 'The cat is vibrating slightly. This seems bad.'],
  [9, 'The cat is glowing. Maybe stop?'],
  [10, 'One more click and something terrible will happen.'],
]
const BLOW_UP_AFTER = 10
const RESPAWN_SECONDS = 4

const PUFF_COLORS = ['#f0a14f', '#fff4e6', '#ffffff', '#ffd27a', '#d9863a']
const PUFFS = Array.from({ length: 26 }, (_, i) => {
  const a = i * 2.39996 // golden angle: an even spread all round
  const up = 0.35 + ((i * 7) % 10) / 10
  return {
    v: new THREE.Vector3(Math.cos(a) * 0.9, up * 1.6, Math.sin(a) * 0.9).multiplyScalar(0.7 + ((i * 3) % 5) * 0.12),
    size: 0.03 + ((i * 5) % 7) * 0.008,
    color: PUFF_COLORS[i % PUFF_COLORS.length],
  }
})

/** Cartoon explosion: a white flash and puffs of cat-coloured smoke flying out and shrinking. */
function Explosion({ age }: { age: React.MutableRefObject<number> }) {
  const puffs = useRef<(THREE.Mesh | null)[]>([])
  const flash = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const t = age.current
    PUFFS.forEach((p, i) => {
      const m = puffs.current[i]
      if (!m) return
      m.position.set(p.v.x * t, p.v.y * t - 1.4 * t * t, p.v.z * t)
      m.scale.setScalar(Math.max(0, 1 + t * 1.5 - t * t * 2.2))
    })
    if (flash.current) flash.current.scale.setScalar(Math.max(0, 0.35 * (1 - t * 4)) + 0.0001)
  })
  return (
    <group position={[0, 0.07, 0]}>
      <mesh ref={flash}>
        <sphereGeometry args={[1, 7, 5]} />
        <meshBasicMaterial color={new THREE.Color(4, 3.6, 3)} toneMapped={false} />
      </mesh>
      {PUFFS.map((p, i) => (
        <mesh key={i} ref={(m) => { puffs.current[i] = m }}>
          <sphereGeometry args={[p.size, 7, 5]} />
          <Toon color={p.color} />
        </mesh>
      ))}
    </group>
  )
}

/** A sleeping cat on the bed. Breathes, answers when clicked, and has limits. */
function Cat({ interactive, onToast }: { interactive: boolean; onToast: (m: string) => void }) {
  const motion = useMotion()
  const time = useSceneTime()
  const body = useRef<THREE.Group>(null)
  const poked = useRef(-10)
  const clicks = useRef(0)
  const blownAt = useRef(-100)
  const age = useRef(0)
  const [state, setState] = useState<'here' | 'boom'>('here')
  const ORANGE = '#f0a14f'
  const CREAM = '#fff4e6'

  useFrame(() => {
    const t = time.current
    age.current = t - blownAt.current
    if (state === 'boom' && age.current > RESPAWN_SECONDS) {
      setState('here')
      onToast('A new cat has appeared. Cats have nine lives.')
    }
    if (!body.current) return
    const breathe = motion ? Math.sin(t * 2.2) * 0.03 : 0
    const hop = Math.sin(Math.min(1, Math.max(0, t - poked.current) * 3) * Math.PI) * 0.04
    // the angrier it gets, the more it shakes
    const shake = clicks.current >= 7 ? Math.sin(t * 60) * 0.004 * (clicks.current - 6) : 0
    // pops back in after respawning
    const pop = Math.min(1, Math.max(0, age.current - RESPAWN_SECONDS) * 4)
    const appear = blownAt.current < 0 ? 1 : 1 + Math.sin(pop * Math.PI) * 0.25 * (1 - pop) + (pop - 1)
    body.current.scale.set(appear, appear * (1 + breathe), appear)
    body.current.position.set(shake, hop, 0)
  })

  return (
    <Clickable
      enabled={interactive && state === 'here'}
      position={[BED.x, BED.mattressTop + 0.045, BED.head + 0.62]}
      rotation={[0, 0.5, 0]}
      onClick={() => {
        clicks.current += 1
        poked.current = time.current
        if (clicks.current > BLOW_UP_AFTER) {
          clicks.current = 0
          blownAt.current = time.current
          age.current = 0
          setState('boom')
          sfx.boom()
          onToast('BOOM. You were warned.')
          return
        }
        sfx.meow()
        onToast(CAT_MOODS.filter(([n]) => clicks.current >= n).at(-1)![1])
      }}
    >
      {state === 'boom' && <Explosion age={age} />}
      <group ref={body} visible={state === 'here'}>
        <Part position={[0, 0.055, 0]} scale={[0.15, 0.065, 0.105]} color={ORANGE} shape={<sphereGeometry args={[1, 7, 5]} />} />
        <Part position={[-0.06, 0.05, 0.05]} scale={[0.06, 0.04, 0.05]} color={CREAM} ink={false} shape={<sphereGeometry args={[1, 7, 5]} />} />
        <Part position={[0.09, 0.07, 0.0]} scale={[0.03, 0.022, 0.07]} color="#d9863a" ink={false} shape={<sphereGeometry args={[1, 7, 5]} />} />
        <Part rotation={[-Math.PI / 2, 0, 1.2]} position={[0, 0.02, 0]} color={ORANGE} shape={<torusGeometry args={[0.13, 0.018, 4, 9, 2.3]} />} />
        <group position={[-0.13, 0.07, 0.06]}>
          <Part scale={[0.068, 0.062, 0.064]} color={ORANGE} shape={<sphereGeometry args={[1, 7, 5]} />} />
          <Part position={[-0.012, -0.018, 0.045]} scale={[0.032, 0.022, 0.025]} color={CREAM} ink={false} shape={<sphereGeometry args={[1, 7, 5]} />} />
          {[-0.032, 0.03].map((x) => (
            <Part key={x} position={[x, 0.058, -0.005]} rotation={[0, 0, x * 6]} color={ORANGE} shape={<coneGeometry args={[0.022, 0.045, 4]} />} />
          ))}
          {/* closed, contented eyes */}
          {[-0.026, 0.022].map((x) => (
            <Part key={x} position={[x, 0.008, 0.061]} rotation={[0, 0, Math.PI]} color="#1d1830" ink={false} shape={<torusGeometry args={[0.011, 0.0025, 4, 9, Math.PI]} />} />
          ))}
        </group>
      </group>
    </Clickable>
  )
}

export default function Corner({ interactive, onToast }: { interactive: boolean; onToast: (m: string) => void }) {
  return (
    <>
      <WallDecor />
      <Bookshelf />
      <FloorPlant />
      <Bed />
      <Cat interactive={interactive} onToast={onToast} />
    </>
  )
}

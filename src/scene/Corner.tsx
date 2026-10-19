import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useMotion } from '../lib/motion'
import { sfx } from '../lib/sound'
import { ROOM } from './layout'
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
      <Part position={[1.84, 1.97, WALL_Z + 0.01]} color={RED} shape={<sphereGeometry args={[0.012, 8, 6]} />} />
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
      <Part position={[0.3, top + 0.045, 0.02]} color="#e8e2d6" shape={<cylinderGeometry args={[0.04, 0.032, 0.09, 16]} />} />
      <Part position={[0.3, top + 0.12, 0.02]} scale={[0.03, 0.06, 0.03]} color="#5bb36a" shape={<sphereGeometry args={[1, 12, 8]} />} />
    </group>
  )
}

/** A daruma: red body, white face, one eye filled in (a wish in progress). */
function Daruma(props: { position: THREE.Vector3Tuple }) {
  return (
    <group {...props}>
      <Part position={[0, 0.075, 0]} scale={[0.07, 0.078, 0.065]} color={RED} shape={<sphereGeometry args={[1, 20, 14]} />} />
      <Part position={[0.01, 0.09, 0.048]} scale={[0.045, 0.04, 0.025]} color="#fff6ea" ink={false} shape={<sphereGeometry args={[1, 16, 10]} />} />
      <Part position={[-0.006, 0.095, 0.072]} color="#1d1830" ink={false} shape={<sphereGeometry args={[0.008, 8, 6]} />} />
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
      <Part position={[0, 0.15, 0]} color="#e8e2d6" shape={<cylinderGeometry args={[0.13, 0.1, 0.3, 24]} />} />
      {leaves.map(({ a, y, tilt, color }) => (
        <group key={a} position={[0, y, 0]} rotation={[0, a, 0]}>
          <Part position={[0, 0, 0.12]} rotation={[tilt, 0, 0]} scale={[0.09, 0.012, 0.15]} color={color} shape={<sphereGeometry args={[1, 14, 8]} />} />
        </group>
      ))}
      <Part position={[0, 0.5, 0]} color="#4f7f4a" shape={<cylinderGeometry args={[0.01, 0.012, 0.5, 8]} />} />
    </group>
  )
}

function Futon() {
  const x = ROOM.halfWidth - 0.5
  return (
    <group>
      <Block size={[0.95, 0.09, 2.0]} position={[x, 0.045, -0.15]} color="#f5f2ec" />
      <Block size={[0.97, 0.06, 1.35]} position={[x, 0.11, 0.17]} color={BLUE} />
      <Block size={[0.97, 0.066, 0.13]} position={[x, 0.114, -0.5]} color="#e8edf8" />
      <Part position={[x, 0.13, -0.92]} scale={[0.3, 0.06, 0.17]} color="#ffffff" shape={<sphereGeometry args={[1, 20, 12]} />} />
      {/* a floor cushion on the rug */}
      <Block size={[0.48, 0.06, 0.48]} position={[-0.5, 0.04, 0.75]} rotation={[0, 0.3, 0]} color={RED} />
    </group>
  )
}

/** A sleeping cat on the futon. Breathes, and answers when clicked. */
function Cat({ interactive, onToast }: { interactive: boolean; onToast: (m: string) => void }) {
  const motion = useMotion()
  const clock = useThree((s) => s.clock)
  const body = useRef<THREE.Group>(null)
  const poked = useRef(-10)
  const ORANGE = '#f0a14f'
  const CREAM = '#fff4e6'

  useFrame(({ clock: c }) => {
    if (!body.current) return
    const t = c.elapsedTime
    const breathe = motion ? Math.sin(t * 2.2) * 0.03 : 0
    const hop = Math.max(0, Math.sin(Math.min(1, (t - poked.current) * 3) * Math.PI)) * 0.04
    body.current.scale.set(1, 1 + breathe, 1)
    body.current.position.y = hop
  })

  return (
    <Clickable
      enabled={interactive}
      position={[ROOM.halfWidth - 0.55, 0.15, -0.6]}
      rotation={[0, 0.5, 0]}
      onClick={() => {
        poked.current = clock.elapsedTime
        sfx.meow()
        onToast('The cat opens one eye, decides you are fine, and goes back to sleep.')
      }}
    >
      <group ref={body}>
        <Part position={[0, 0.055, 0]} scale={[0.15, 0.065, 0.105]} color={ORANGE} shape={<sphereGeometry args={[1, 20, 14]} />} />
        <Part position={[-0.06, 0.05, 0.05]} scale={[0.06, 0.04, 0.05]} color={CREAM} ink={false} shape={<sphereGeometry args={[1, 14, 10]} />} />
        <Part position={[0.09, 0.07, 0.0]} scale={[0.03, 0.022, 0.07]} color="#d9863a" ink={false} shape={<sphereGeometry args={[1, 12, 8]} />} />
        <Part rotation={[-Math.PI / 2, 0, 1.2]} position={[0, 0.02, 0]} color={ORANGE} shape={<torusGeometry args={[0.13, 0.018, 8, 24, 2.3]} />} />
        <group position={[-0.13, 0.07, 0.06]}>
          <Part scale={[0.068, 0.062, 0.064]} color={ORANGE} shape={<sphereGeometry args={[1, 20, 14]} />} />
          <Part position={[-0.012, -0.018, 0.045]} scale={[0.032, 0.022, 0.025]} color={CREAM} ink={false} shape={<sphereGeometry args={[1, 12, 8]} />} />
          {[-0.032, 0.03].map((x) => (
            <Part key={x} position={[x, 0.058, -0.005]} rotation={[0, 0, x * 6]} color={ORANGE} shape={<coneGeometry args={[0.022, 0.045, 4]} />} />
          ))}
          {/* closed, contented eyes */}
          {[-0.026, 0.022].map((x) => (
            <Part key={x} position={[x, 0.008, 0.061]} rotation={[0, 0, Math.PI]} color="#1d1830" ink={false} shape={<torusGeometry args={[0.011, 0.0025, 6, 12, Math.PI]} />} />
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
      <Futon />
      <Cat interactive={interactive} onToast={onToast} />
    </>
  )
}

import { motion } from 'motion/react'
import { PROFILE } from '../data/content'

// The left side of the menu: a white panel with a cel-shaded moon (P3's motif) where the
// game puts its character art, giant vertical lettering on the edge, and drifting shards.

const [FIRST, LAST] = PROFILE.name.toUpperCase().split(' ')

// A crescent: the disc of radius 340 at the origin minus the CUT disc. The two arcs meet
// where the circles intersect, (37.1, -338) and (260, 219.1); the horns point at the menu.
const CUT = { x: 150, y: -60, r: 300 }
const CRESCENT = 'M37.1 -338 A340 340 0 1 0 260 219.1 A300 300 0 0 1 37.1 -338Z'

// deterministic scatter, so the shards don't jump around between renders
const SHARDS = Array.from({ length: 16 }, (_, i) => {
  const r = (n: number) => (Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1
  const rand = (n: number) => Math.abs(r(n))
  return {
    left: `${8 + rand(1) * 88}%`,
    top: `${4 + rand(2) * 90}%`,
    size: 10 + rand(3) * 26,
    rotate: rand(4) * 360,
    color: ['#ff4fa3', '#ff8cc6', '#e0389a', '#ffffff'][i % 4],
    duration: 7 + rand(5) * 8,
    delay: -rand(6) * 10,
    shape: i % 3,
  }
})

const SHARD_SHAPES = ['polygon(50% 0, 100% 100%, 0 80%)', 'polygon(0 0, 100% 20%, 70% 100%, 10% 70%)', 'polygon(20% 0, 100% 40%, 40% 100%)']

// jagged blue strands along the panel's diagonal edge, like cel-shaded hair against the sky
function strandPoints(offset: number, reach: number) {
  const pts: string[] = ['100,-2']
  for (let k = 0; k <= 14; k++) {
    const t = k / 14
    const x = 100 - 30 * t
    const y = t * 100
    pts.push(`${x + offset + (k % 2 ? reach : reach * 0.25)},${y + (k % 2 ? 2.5 : 0)}`)
  }
  pts.push('70,102', `${70 - 4},102`, `${100 - 4},-2`)
  return pts.join(' ')
}

export default function MoonArt() {
  return (
    <motion.div
      className="art"
      aria-hidden="true"
      initial={{ x: '-70%' }}
      animate={{ x: 0 }}
      exit={{ x: '-70%', transition: { duration: 0.22, ease: 'easeIn' } }}
      transition={{ type: 'spring', stiffness: 140, damping: 22 }}
    >
      <div className="art-panel" />
      <svg className="art-edge" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon points={strandPoints(2, 6)} fill="#2b56f0" />
        <polygon points={strandPoints(0, 3.5)} fill="#8ad8ff" />
      </svg>

      {/* behind the moon, the way the game's lettering sits behind its character art */}
      <div className="art-name">
        <span className="art-name-first">{FIRST}</span>
        <span className="art-name-last">{LAST}</span>
      </div>

      <svg className="art-moon" viewBox="-400 -400 800 800">
        <defs>
          <clipPath id="moon-clip">
            <path d={CRESCENT} />
          </clipPath>
        </defs>
        {/* a slightly offset black copy reads as a brush outline, heavier at the bottom left */}
        <path d={CRESCENT} transform="translate(-12 10)" fill="#08080f" />
        <path d={CRESCENT} fill="#ffffff" />
        <g clipPath="url(#moon-clip)">
          {/* cel-shaded bands hugging the inner edge */}
          <circle cx={CUT.x} cy={CUT.y} r={CUT.r + 34} fill="#8ad8ff" />
          <circle cx={CUT.x} cy={CUT.y} r={CUT.r + 14} fill="#2b56f0" />
          <ellipse cx="-245" cy="-40" rx="34" ry="52" fill="#d4f0ff" />
          <ellipse cx="-190" cy="150" rx="24" ry="34" fill="#d4f0ff" />
          {/* ink hatching along the outer rim */}
          <path d="M-300 -150 a330 330 0 0 0 0 300 M-270 -215 a330 330 0 0 0 -28 120" fill="none" stroke="#08080f" strokeWidth="7" strokeLinecap="round" />
        </g>
        <path d={CRESCENT} fill="none" stroke="#08080f" strokeWidth="9" strokeLinejoin="round" />
      </svg>

      {SHARDS.map((s, i) => (
        <span
          key={i}
          className="shard"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            background: s.color,
            clipPath: SHARD_SHAPES[s.shape],
            rotate: `${s.rotate}deg`,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </motion.div>
  )
}

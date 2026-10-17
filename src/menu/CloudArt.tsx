import { motion } from 'motion/react'
import { PROFILE } from '../data/content'

// The left side of the menu: a white panel with cel-shaded clouds where the game puts its
// character art, giant vertical lettering on the edge, and drifting shards.

const [FIRST, LAST] = PROFILE.name.toUpperCase().split(' ')

type Puff = [cx: number, cy: number, r: number]
type CloudShape = { id: string; puffs: Puff[]; base: [x: number, y: number, w: number, h: number] }

// In a 600×1000 box. Each cloud is the union of its puffs plus a flat-bottomed base.
const CLOUDS: CloudShape[] = [
  {
    id: 'big',
    puffs: [
      [150, 520, 95],
      [255, 465, 122],
      [365, 510, 90],
      [90, 585, 62],
      [432, 575, 58],
    ],
    base: [90, 560, 342, 78],
  },
  {
    id: 'top',
    puffs: [
      [335, 305, 58],
      [405, 278, 74],
      [475, 310, 52],
    ],
    base: [335, 305, 140, 48],
  },
  {
    id: 'low',
    puffs: [
      [125, 832, 54],
      [195, 800, 70],
      [265, 838, 48],
    ],
    base: [125, 830, 140, 46],
  },
]

function CloudShapes({ puffs, base, grow = 0, dx = 0, dy = 0 }: Omit<CloudShape, 'id'> & { grow?: number; dx?: number; dy?: number }) {
  const [x, y, w, h] = base
  return (
    <>
      {puffs.map(([cx, cy, r]) => (
        <circle key={`${cx},${cy}`} cx={cx + dx} cy={cy + dy} r={r + grow} />
      ))}
      <rect x={x - grow + dx} y={y - grow + dy} width={w + grow * 2} height={h + grow * 2} rx={grow} />
    </>
  )
}

/** One cloud: an offset black copy for the ink outline, then white with shading bands underneath. */
function Cloud({ id, puffs, base }: CloudShape) {
  return (
    <g className={`cloud cloud-${id}`}>
      <defs>
        <clipPath id={`cloud-${id}`}>
          <CloudShapes puffs={puffs} base={base} />
        </clipPath>
      </defs>
      {/* outline all the way round, heavier at the bottom left like a brush stroke */}
      <g fill="#08080f">
        <CloudShapes puffs={puffs} base={base} grow={12} dx={-5} dy={5} />
      </g>
      <g clipPath={`url(#cloud-${id})`}>
        <rect x="0" y="0" width="600" height="1000" fill="#2b56f0" />
        <g fill="#8ad8ff">
          <CloudShapes puffs={puffs} base={base} dy={-16} />
        </g>
        <g fill="#ffffff">
          <CloudShapes puffs={puffs} base={base} dy={-32} />
        </g>
      </g>
    </g>
  )
}

// deterministic scatter, so the shards don't jump around between renders
const SHARDS = Array.from({ length: 16 }, (_, i) => {
  const rand = (n: number) => Math.abs((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1)
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

export default function CloudArt() {
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

      {/* behind the clouds, the way the game's lettering sits behind its character art */}
      <div className="art-name">
        <span className="art-name-first">{FIRST}</span>
        <span className="art-name-last">{LAST}</span>
      </div>

      <svg className="art-clouds" viewBox="0 0 600 1000" preserveAspectRatio="xMinYMid meet">
        {CLOUDS.map((c) => (
          <Cloud key={c.id} {...c} />
        ))}
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

import { useEffect, useRef, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { PROFILE, type MenuItem } from '../data/content'
import { isCoarsePointer } from '../lib/env'
import MotionToggle from '../MotionToggle'
import SoundToggle from '../SoundToggle'
import LinkCards from './LinkCards'
import CloudArt from './CloudArt'

// Hand-set placement for each row of the stacked list, like the game's menu:
// x = indent (in menu-font ems), size = font scale, tint = which shade of pale blue.
const ROWS = [
  { x: 0.55, size: 1, tint: 0 },
  { x: 0.1, size: 0.95, tint: 1 },
  { x: 0.95, size: 0.86, tint: 2 },
  { x: 0.4, size: 1.08, tint: 1 },
  { x: 0, size: 1, tint: 0 },
  { x: 0.9, size: 0.78, tint: 2 },
]

/** Red slash and a pink-edged white blade behind the selected item; they snap in on mount. */
function Highlight() {
  return (
    <svg className="menu-hl" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <polygon className="hl-blade hl-pink" points="3,35 103,-1 95,16" />
      <polygon className="hl-blade" points="0,35 100,0 92,17" />
      <polygon className="hl-red" points="5,31 95,11 93,21 8,35" />
    </svg>
  )
}

type Props = {
  items: MenuItem[]
  index: number
  canExit: boolean
  onSelect: (i: number) => void
  onFocusItem: (i: number) => void
  onOpen: (i: number) => void
}

export default function MainMenu({ items, index, canExit, onSelect, onFocusItem, onOpen }: Props) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const active = items[index]
  const touch = isCoarsePointer()

  // focus follows the highlight (also on mount, when coming back from a panel),
  // so a native Enter on the focused button always opens the highlighted item
  useEffect(() => {
    itemRefs.current[index]?.focus({ preventScroll: true })
  }, [index])

  return (
    <motion.div className="main-menu" exit={{ opacity: 0, transition: { duration: 0.18, delay: 0.12 } }}>
      <div className="layer" style={{ '--depth': -14 } as CSSProperties}>
        <CloudArt />
      </div>

      <motion.div
        className="player-box"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30, transition: { duration: 0.15 } }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 24 }}
      >
        <p className="player-name">{PROFILE.name}</p>
        <p className="player-label">current player</p>
      </motion.div>

      <div className="layer" style={{ '--depth': 10 } as CSSProperties}>
        <nav aria-label="Main menu">
          <ul className="menu-list">
            {items.map((item, i) => {
              const row = ROWS[i % ROWS.length]
              const selected = i === index
              return (
                <motion.li
                  key={item.id}
                  className={`tint-${row.tint}${selected ? ' is-selected' : ''}`}
                  style={{ '--x': row.x, '--size': row.size, '--bob': `${2.4 + (i % 3) * 0.6}s`, '--bob-delay': `${-i * 0.5}s` } as CSSProperties}
                  initial={{ opacity: 0, x: 160 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -180, transition: { duration: 0.16, delay: i * 0.02 } }}
                  transition={{ delay: 0.12 + i * 0.05, type: 'spring', stiffness: 380, damping: 28 }}
                >
                  <button
                    ref={(el) => {
                      itemRefs.current[i] = el
                    }}
                    className={`menu-item${selected ? ' is-active' : ''}`}
                    tabIndex={selected ? 0 : -1}
                    onMouseEnter={() => onSelect(i)}
                    onFocus={() => onFocusItem(i)}
                    onClick={() => onOpen(i)}
                  >
                    {selected && <Highlight />}
                    <span className="menu-label">{item.label}</span>
                  </button>
                </motion.li>
              )
            })}
          </ul>
        </nav>
      </div>

      <div className="layer layer-cards" style={{ '--depth': 18 } as CSSProperties}>
        <LinkCards />
      </div>

      <motion.div
        className="command"
        initial={{ opacity: 0, x: 80 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 80, transition: { duration: 0.15 } }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 28 }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={active.id}
            className="command-text"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.14 }}
          >
            {active.command}
          </motion.p>
        </AnimatePresence>
        <div className="command-rule">
          <span>Command</span>
        </div>
        <p className="command-hints">
          <span>
            <kbd className="round">{touch ? 'Tap' : '↵'}</kbd>Confirm
          </span>
          {canExit && !touch && (
            <span>
              <kbd className="round">Esc</kbd>Close
            </span>
          )}
        </p>
      </motion.div>

      <div className="menu-sound">
        <MotionToggle />
        <SoundToggle />
      </div>
    </motion.div>
  )
}

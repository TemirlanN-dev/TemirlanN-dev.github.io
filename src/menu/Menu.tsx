import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MENU, PROFILE, type MenuItem, type SectionId } from '../data/content'
import { sfx } from '../lib/sound'
import SoundToggle from '../SoundToggle'
import Hud from './Hud'
import Panel from './Panel'
import WaterBackground from './WaterBackground'

type MenuProps = {
  section: SectionId | null
  onSection: (section: SectionId | null) => void
  /** missing when there is no arcade to go back to (no WebGL) */
  onExit?: () => void
}

const isUp = (key: string) => key === 'ArrowUp' || key === 'w' || key === 'W'
const isDown = (key: string) => key === 'ArrowDown' || key === 's' || key === 'S'

export default function Menu({ section, onSection, onExit }: MenuProps) {
  const items = onExit ? MENU : MENU.filter((m) => m.id !== 'exit')
  const [index, setIndex] = useState(() => Math.max(0, items.findIndex((m) => m.id === section)))
  const [wipes, setWipes] = useState(0)

  const open = (i: number) => {
    const item = items[i]
    if (item.id === 'exit') {
      onExit?.()
      return
    }
    sfx.select()
    setWipes((n) => n + 1)
    onSection(item.id)
  }

  const back = () => {
    sfx.back()
    setWipes((n) => n + 1)
    onSection(null)
  }

  const select = (i: number) => {
    if (i === index) return
    sfx.move()
    setIndex(i)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Escape' || (e.key === 'Backspace' && section)) {
        e.preventDefault()
        if (section) back()
        else onExit?.()
        return
      }
      if (section) return
      if (isUp(e.key) || isDown(e.key)) {
        e.preventDefault()
        select((index + (isDown(e.key) ? 1 : -1) + items.length) % items.length)
      } else if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault()
        open(index)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <motion.div
      className="menu"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.3 } }}
      // an old CRT switching off: collapse to a bright line, then to a dot
      exit={{ scaleY: [1, 0.006, 0.006], scaleX: [1, 1, 0], filter: ['brightness(1)', 'brightness(3)', 'brightness(3)'], transition: { duration: 0.45, times: [0, 0.55, 1], ease: 'easeIn' } }}
    >
      <WaterBackground />
      <motion.div className="flash" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.7 }} />

      <Hud className={section ? 'is-in-panel' : ''} />

      <AnimatePresence mode="wait">
        {section ? (
          <Panel key={section} id={section} onBack={back} />
        ) : (
          <MainMenu key="main" items={items} index={index} onSelect={select} onFocusItem={setIndex} onOpen={open} />
        )}
      </AnimatePresence>

      {/* a blue slash across the screen whenever you change pages */}
      {wipes > 0 && (
        <motion.div
          key={wipes}
          className="wipe"
          aria-hidden="true"
          initial={{ x: '110vw', skewX: -18 }}
          animate={{ x: '-120vw', skewX: -18 }}
          transition={{ duration: 0.6, ease: [0.7, 0, 0.3, 1] }}
        />
      )}

      <footer className={`menu-foot${section ? ' is-in-panel' : ''}`}>
        <div className="hints">
          {!section && (
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd>Select
            </span>
          )}
          {!section && (
            <span>
              <kbd>Enter</kbd>Open
            </span>
          )}
          {section === 'projects' && (
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd>Browse
            </span>
          )}
          {(section || onExit) && (
            <span>
              <kbd>Esc</kbd>
              {section ? 'Back' : 'Arcade'}
            </span>
          )}
        </div>
        <SoundToggle />
      </footer>
    </motion.div>
  )
}

type MainMenuProps = {
  items: MenuItem[]
  index: number
  onSelect: (i: number) => void
  onFocusItem: (i: number) => void
  onOpen: (i: number) => void
}

function MainMenu({ items, index, onSelect, onFocusItem, onOpen }: MainMenuProps) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const active = items[index]

  // focus follows the highlight (also on mount, when coming back from a panel),
  // so a native Enter on the focused button always opens the highlighted item
  useEffect(() => {
    itemRefs.current[index]?.focus({ preventScroll: true })
  }, [index])

  return (
    <motion.div className="main-menu" exit={{ opacity: 0, x: -80, transition: { duration: 0.18 } }}>
      <div className="menu-brand">
        <p className="menu-name">{PROFILE.name}</p>
        <p className="menu-role">{PROFILE.role}</p>
      </div>

      <nav aria-label="Main menu">
        <ul className="menu-list">
          {items.map((item, i) => (
            <motion.li
              key={item.id}
              style={{ '--i': i } as CSSProperties}
              initial={{ opacity: 0, x: -70 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + i * 0.045, type: 'spring', stiffness: 420, damping: 32 }}
            >
              <button
                ref={(el) => {
                  itemRefs.current[i] = el
                }}
                className={`menu-item${i === index ? ' is-active' : ''}${item.id === 'exit' ? ' is-small' : ''}`}
                tabIndex={i === index ? 0 : -1}
                onMouseEnter={() => onSelect(i)}
                onFocus={() => onFocusItem(i)}
                onClick={() => onOpen(i)}
              >
                {i === index && (
                  <motion.span layoutId="menu-highlight" className="menu-highlight" transition={{ type: 'spring', stiffness: 600, damping: 38 }}>
                    <span className="menu-highlight-shadow" />
                    <span className="menu-highlight-face" />
                  </motion.span>
                )}
                <span className="menu-label">{item.label}</span>
              </button>
            </motion.li>
          ))}
        </ul>
      </nav>

      <AnimatePresence mode="popLayout">
        <motion.aside
          key={active.id}
          className="menu-info"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.18 }}
        >
          <span className="menu-info-num" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <p className="menu-info-desc">{active.desc}</p>
        </motion.aside>
      </AnimatePresence>
    </motion.div>
  )
}

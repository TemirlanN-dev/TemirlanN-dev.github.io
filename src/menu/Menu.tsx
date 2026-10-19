import { useEffect, useRef, useState, type RefObject } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MENU, type SectionId } from '../data/content'
import { isCoarsePointer } from '../lib/env'
import { useMotion } from '../lib/motion'
import { sfx } from '../lib/sound'
import MotionToggle from '../MotionToggle'
import SoundToggle from '../SoundToggle'
import Hud from './Hud'
import MainMenu from './MainMenu'
import Panel from './Panel'
import WaterBackground from './WaterBackground'

type MenuProps = {
  section: SectionId | null
  onSection: (section: SectionId | null) => void
  /** missing when there is no room to go back to (no WebGL) */
  onExit?: () => void
}

const isUp = (key: string) => key === 'ArrowUp' || key === 'w' || key === 'W'
const isDown = (key: string) => key === 'ArrowDown' || key === 's' || key === 'S'

/** Feeds the pointer position to CSS (--px/--py, -1..1) so layers can drift at different depths. */
function useParallax(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--px', '0')
    el.style.setProperty('--py', '0')
    if (!enabled || isCoarsePointer()) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--px', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3))
        el.style.setProperty('--py', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3))
      })
    }
    window.addEventListener('pointermove', onMove)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
  }, [ref, enabled])
}

export default function Menu({ section, onSection, onExit }: MenuProps) {
  const items = onExit ? MENU : MENU.filter((m) => m.id !== 'exit')
  const [index, setIndex] = useState(() => Math.max(0, items.findIndex((m) => m.id === section)))
  const [wipes, setWipes] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  useParallax(root, useMotion())

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
      ref={root}
      className="menu"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.3 } }}
      // an old CRT switching off: collapse to a bright line, then to a dot
      exit={{ scaleY: [1, 0.006, 0.006], scaleX: [1, 1, 0], filter: ['brightness(1)', 'brightness(3)', 'brightness(3)'], transition: { duration: 0.45, times: [0, 0.55, 1], ease: 'easeIn' } }}
    >
      <WaterBackground />
      <motion.div className="flash" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.7 }} />

      <AnimatePresence mode="wait">
        {section ? (
          <Panel key={section} id={section} onBack={back} />
        ) : (
          <MainMenu key="main" items={items} index={index} canExit={!!onExit} onSelect={select} onFocusItem={setIndex} onOpen={open} />
        )}
      </AnimatePresence>

      {section && <Hud className="is-in-panel" />}

      {/* a slash across the screen whenever you change pages */}
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

      {section && (
        <footer className="menu-foot">
          <div className="hints">
            {section === 'projects' && (
              <span>
                <kbd>↑</kbd>
                <kbd>↓</kbd>Browse
              </span>
            )}
            <span>
              <kbd>Esc</kbd>Back
            </span>
          </div>
          <div className="toggles">
            <MotionToggle />
            <SoundToggle />
          </div>
        </footer>
      )}
    </motion.div>
  )
}

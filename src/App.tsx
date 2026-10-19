import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig } from 'motion/react'
import { SECTION_IDS, type SectionId } from './data/content'
import { hasWebGL } from './lib/env'
import { useMotion } from './lib/motion'
import { sfx } from './lib/sound'
import type { Phase } from './types'
import Loading from './Loading'
import Menu from './menu/Menu'
import RoomHud from './RoomHud'

// three.js only downloads if the room is actually shown
const Scene = lazy(() => import('./scene/Scene'))

/** `#menu` or `#projects` etc. open the menu directly, so sections can be linked to. */
function readHash(): { menu: boolean; section: SectionId | null } {
  const hash = location.hash.slice(1)
  const section = (SECTION_IDS as readonly string[]).includes(hash) ? (hash as SectionId) : null
  return { menu: hash === 'menu' || section !== null, section }
}

export default function App() {
  const [initial] = useState(() => {
    const { menu, section } = readHash()
    return { phase: (menu || !hasWebGL ? 'menu' : 'room') as Phase, section }
  })
  const [phase, setPhase] = useState<Phase>(initial.phase)
  const [section, setSection] = useState<SectionId | null>(initial.section)
  const [sceneWanted, setSceneWanted] = useState(initial.phase === 'room')
  const [sceneReady, setSceneReady] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const motion = useMotion()

  useEffect(() => {
    const hash = phase === 'menu' ? `#${section ?? 'menu'}` : ''
    if (location.hash !== hash) history.replaceState(null, '', hash || location.pathname + location.search)
  }, [phase, section])

  const start = () => {
    if (phase !== 'room') return
    sfx.coin()
    setPhase('zoomIn')
  }

  const skip = () => {
    sfx.select()
    setPhase('menu')
  }

  const exitToRoom = () => {
    sfx.back()
    setSection(null)
    setSceneWanted(true)
    setPhase('zoomOut')
  }

  const showToast = (message: string) => {
    clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = setTimeout(() => setToast(null), 2400)
  }

  // Enter or Space in the room = log in at the monitor
  useEffect(() => {
    if (phase !== 'room') return
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault()
        start()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <MotionConfig reducedMotion={motion ? 'never' : 'always'}>
      {hasWebGL && sceneWanted && (
        <Suspense fallback={<Loading />}>
          <Scene
            phase={phase}
            onStart={start}
            onZoomInDone={() => setPhase('menu')}
            onZoomOutDone={() => setPhase('room')}
            onToast={showToast}
            onReady={() => setSceneReady(true)}
          />
        </Suspense>
      )}

      <AnimatePresence>{phase === 'room' && <RoomHud key="room" ready={sceneReady} toast={toast} onSkip={skip} />}</AnimatePresence>

      <AnimatePresence>
        {phase === 'menu' && <Menu key="menu" section={section} onSection={setSection} onExit={hasWebGL ? exitToRoom : undefined} />}
      </AnimatePresence>
    </MotionConfig>
  )
}

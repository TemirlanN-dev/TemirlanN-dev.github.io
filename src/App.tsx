import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, MotionConfig } from 'motion/react'
import { MENU, PROFILE, SECTION_IDS, type SectionId } from './data/content'
import { hasWebGL } from './lib/env'
import { useMotion } from './lib/motion'
import { sfx } from './lib/sound'
import type { Phase } from './types'
import Loading from './Loading'
import Menu from './menu/Menu'
import { showProjectFirst } from './menu/sections/Projects'
import RoomHud from './RoomHud'

// three.js only downloads if the room is actually shown
const Scene = lazy(() => import('./scene/Scene'))

/** `#menu` or `#projects` etc. open the menu directly, so sections can be linked to. */
function readHash(): { menu: boolean; section: SectionId | null } {
  const hash = location.hash.slice(1)
  const section = (SECTION_IDS as readonly string[]).includes(hash) ? (hash as SectionId) : null
  return { menu: hash === 'menu' || section !== null, section }
}

/** If the 3D room fails to load or crashes, the site carries on as the plain menu. */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
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
  const [sceneFailed, setSceneFailed] = useState(false)
  const canShowRoom = hasWebGL && !sceneFailed
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const motion = useMotion()

  // The address follows what is on screen. Each move is a history entry, so the browser's
  // back button steps panel → menu → room instead of leaving the site.
  const firstSync = useRef(true)
  useEffect(() => {
    const label = section && MENU.find((m) => m.id === section)?.label
    document.title = label ? `${label} · ${PROFILE.name}` : PROFILE.name

    // the dive and the pull-back are in between two addresses; wait for them to land
    if (phase !== 'menu' && phase !== 'room') return
    const hash = phase === 'menu' ? `#${section ?? 'menu'}` : ''
    const first = firstSync.current
    firstSync.current = false
    if (location.hash === hash) return
    const url = hash || location.pathname + location.search
    // the entry the visitor arrived on is corrected in place, never duplicated
    if (first) history.replaceState(null, '', url)
    else history.pushState(null, '', url)
  }, [phase, section])

  // back/forward, or a hash typed into the address bar
  useEffect(() => {
    const onNavigate = () => {
      const target = readHash()
      if (target.menu) {
        setSection(target.section)
        setPhase('menu')
      } else if (canShowRoom) {
        setSection(null)
        setSceneWanted(true)
        setPhase((p) => (p === 'menu' || p === 'zoomIn' ? 'zoomOut' : p))
      }
    }
    window.addEventListener('popstate', onNavigate)
    return () => window.removeEventListener('popstate', onNavigate)
  }, [canShowRoom])

  const sceneCrashed = () => {
    setSceneFailed(true)
    setPhase('menu')
  }

  const start = () => {
    if (phase !== 'room') return
    sfx.coin()
    setPhase('zoomIn')
  }

  /** A sticky note in the room: dive into the monitor and land on that page. */
  const openFromRoom = (target: SectionId, project?: string) => {
    if (phase !== 'room') return
    showProjectFirst(project ?? null)
    setSection(target)
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
      {canShowRoom && sceneWanted && (
        <SceneBoundary onError={sceneCrashed}>
          <Suspense fallback={<Loading />}>
            <Scene
              phase={phase}
              onStart={start}
              onOpen={openFromRoom}
              onZoomInDone={() => setPhase('menu')}
              onZoomOutDone={() => setPhase('room')}
              onToast={showToast}
              onReady={() => setSceneReady(true)}
            />
          </Suspense>
        </SceneBoundary>
      )}

      <AnimatePresence>{phase === 'room' && <RoomHud key="room" ready={sceneReady} toast={toast} onSkip={skip} />}</AnimatePresence>

      <AnimatePresence>
        {phase === 'menu' && <Menu key="menu" section={section} onSection={setSection} onExit={canShowRoom ? exitToRoom : undefined} />}
      </AnimatePresence>
    </MotionConfig>
  )
}

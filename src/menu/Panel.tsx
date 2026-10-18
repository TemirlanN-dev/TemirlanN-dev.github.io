import { useEffect, useRef, type ComponentType } from 'react'
import { motion } from 'motion/react'
import { SECTION_IDS, type SectionId } from '../data/content'
import About from './sections/About'
import Contact from './sections/Contact'
import Experience from './sections/Experience'
import Projects from './sections/Projects'
import Stats from './sections/Stats'

const SECTIONS: Record<SectionId, { title: string; Body: ComponentType }> = {
  projects: { title: 'Projects', Body: Projects },
  experience: { title: 'Experience', Body: Experience },
  stats: { title: 'Stats', Body: Stats },
  about: { title: 'About', Body: About },
  contact: { title: 'Contact', Body: Contact },
}

export default function Panel({ id, onBack }: { id: SectionId; onBack: () => void }) {
  const { title, Body } = SECTIONS[id]
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])

  return (
    <motion.section
      ref={ref}
      tabIndex={-1}
      className="panel"
      aria-labelledby="panel-title"
      initial={{ opacity: 0, x: 90 }}
      animate={{ opacity: 1, x: 0, transition: { delay: 0.14, type: 'spring', stiffness: 260, damping: 30 } }}
      exit={{ opacity: 0, x: -60, transition: { duration: 0.16 } }}
    >
      <header className="panel-head">
        <span className="panel-ghost" aria-hidden="true">
          {title}
        </span>
        <button className="chip-btn" onClick={onBack}>
          <span aria-hidden="true">‹</span> Back
        </button>
        <h2 id="panel-title" className="panel-title">
          <span className="panel-num">{String(SECTION_IDS.indexOf(id) + 1).padStart(2, '0')}</span>
          {title}
        </h2>
      </header>
      <div className="panel-body">
        <Body />
      </div>
    </motion.section>
  )
}

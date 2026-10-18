import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LANGUAGE_COLORS, PROJECTS } from '../../data/content'
import { sfx } from '../../lib/sound'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']

export default function Projects() {
  const [active, setActive] = useState(0)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const down = e.key === 'ArrowDown' || e.key === 'ArrowRight'
      const up = e.key === 'ArrowUp' || e.key === 'ArrowLeft'
      if (!down && !up) return
      e.preventDefault()
      const next = (active + (down ? 1 : -1) + PROJECTS.length) % PROJECTS.length
      sfx.move()
      setActive(next)
      buttons.current[next]?.focus({ preventScroll: true })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  const project = PROJECTS[active]

  return (
    <div className="projects">
      <ol className="project-list" aria-label="Pinned projects">
        {PROJECTS.map((p, i) => (
          <li key={p.id}>
            <button
              ref={(el) => {
                buttons.current[i] = el
              }}
              className={`project-btn${i === active ? ' is-active' : ''}`}
              aria-pressed={i === active}
              onClick={() => {
                if (i !== active) sfx.move()
                setActive(i)
              }}
            >
              {i === active && <motion.span layoutId="project-highlight" className="project-highlight" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
              <span className="project-num">{ROMAN[i]}</span>
              <span className="project-name">{p.name}</span>
              <span className="project-lang">
                <i style={{ background: LANGUAGE_COLORS[p.language] }} />
                {p.language}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.article
          key={project.id}
          className="card project-detail"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <p className="eyebrow">{project.tagline}</p>
          <h3 className="project-title">{project.name}</h3>
          {project.team && <p className="project-team">{project.team}</p>}
          <p className="project-summary">{project.summary}</p>
          <ul className="bullets">
            {project.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <ul className="tags" aria-label="Built with">
            {project.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <div className="link-row">
            {project.links.map((l) => (
              <a key={l.href} className="btn" href={l.href} target="_blank" rel="noreferrer">
                {l.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </motion.article>
      </AnimatePresence>
    </div>
  )
}

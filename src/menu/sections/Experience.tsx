import { motion } from 'motion/react'
import { EXPERIENCE } from '../../data/content'

export default function Experience() {
  return (
    <ol className="xp-list">
      {EXPERIENCE.map((x, i) => (
        <motion.li
          key={x.org}
          className="card xp"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + i * 0.07, type: 'spring', stiffness: 300, damping: 30 }}
        >
          <p className="xp-when">{x.when}</p>
          <div>
            <h3 className="xp-role">{x.role}</h3>
            <p className="xp-org">{x.org}</p>
            {x.note && <p className="xp-note">{x.note}</p>}
            <ul className="bullets">
              {x.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            {x.link && (
              <a className="btn btn-ghost" href={x.link.href} target="_blank" rel="noreferrer">
                {x.link.label} <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </motion.li>
      ))}
    </ol>
  )
}

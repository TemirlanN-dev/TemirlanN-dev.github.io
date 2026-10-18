import { motion } from 'motion/react'
import { RECORDS, SKILLS } from '../../data/content'

export default function Stats() {
  return (
    <div className="stats">
      <section>
        <h3 className="sub-heading">Records</h3>
        <ul className="records">
          {RECORDS.map((r, i) => (
            <motion.li
              key={r.label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05, type: 'spring', stiffness: 320, damping: 28 }}
            >
              <span className="record-value">{r.value}</span>
              <span className="record-label">{r.label}</span>
            </motion.li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="sub-heading">Skills</h3>
        {SKILLS.map((group) => (
          <div key={group.name} className="skill-group">
            <h4>{group.name}</h4>
            <ul className="tags">
              {group.items.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  )
}

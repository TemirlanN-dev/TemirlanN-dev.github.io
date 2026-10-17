import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { PROFILE } from '../data/content'

// Stand-ins for the party portraits in the top-right corner: angled frames with
// HP/SP-style bars, each linking somewhere useful.

const ICON = { width: 30, height: 30, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true } as const

const LINKS: { label: string; href: string; icon: ReactNode }[] = [
  {
    label: 'GitHub',
    href: PROFILE.github,
    icon: (
      <svg {...ICON}>
        <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: PROFILE.linkedin,
    icon: (
      <svg {...ICON}>
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11.5H3V9.75Zm6.5 0h3.8v1.6h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1v5.85h-4v-5.2c0-1.24-.02-2.83-1.73-2.83-1.73 0-2 1.35-2 2.74v5.29h-4V9.75Z" />
      </svg>
    ),
  },
  {
    label: 'Email',
    href: `mailto:${PROFILE.email}`,
    icon: (
      <svg {...ICON}>
        <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h17A1.5 1.5 0 0 1 22 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18.5v-13Zm2.2.5 7.8 6.2L19.8 6H4.2ZM20 7.9l-7.38 5.86a1 1 0 0 1-1.24 0L4 7.9V18h16V7.9Z" />
      </svg>
    ),
  },
]

export default function LinkCards() {
  return (
    <div className="cards">
      {LINKS.map((link, i) => (
        <motion.a
          key={link.label}
          className="card-link"
          href={link.href}
          target={link.label === 'Email' ? undefined : '_blank'}
          rel="noreferrer"
          style={{ animationDelay: `${-i * 0.9}s` }}
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: 60, transition: { duration: 0.15 } }}
          transition={{ delay: 0.25 + i * 0.08, type: 'spring', stiffness: 320, damping: 26 }}
        >
          <svg className="card-frame" viewBox="0 0 150 96" preserveAspectRatio="none" aria-hidden="true">
            <polygon points="16,3 147,0 136,93 3,96" />
          </svg>
          <span className="card-icon">{link.icon}</span>
          <span className="card-label">{link.label}</span>
          <span className="card-bars" aria-hidden="true">
            <i className="bar bar-hp" />
            <i className="bar bar-sp" />
          </span>
        </motion.a>
      ))}
    </div>
  )
}

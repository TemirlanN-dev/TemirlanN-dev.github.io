import { useState } from 'react'
import { motion } from 'motion/react'
import { PROFILE } from '../../data/content'
import { sfx } from '../../lib/sound'

const CHANNELS = [
  { kind: 'Email', value: PROFILE.email, href: `mailto:${PROFILE.email}` },
  { kind: 'LinkedIn', value: 'in/temirlan-n', href: PROFILE.linkedin },
  { kind: 'GitHub', value: 'TemirlanN-dev', href: PROFILE.github },
]

export default function Contact() {
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.email)
      sfx.select()
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard blocked; the mailto link still works
    }
  }

  return (
    <ul className="contact-list">
      {CHANNELS.map((c, i) => (
        <motion.li
          key={c.kind}
          className="contact-row"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 300, damping: 28 }}
        >
          <a className="contact-card" href={c.href} target={c.kind === 'Email' ? undefined : '_blank'} rel="noreferrer">
            <span className="contact-kind">{c.kind}</span>
            <span className="contact-value">{c.value}</span>
          </a>
          {c.kind === 'Email' && (
            <button className="chip-btn copy-btn" onClick={copyEmail}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </motion.li>
      ))}
    </ul>
  )
}

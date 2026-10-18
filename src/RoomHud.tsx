import { AnimatePresence, motion } from 'motion/react'
import { PROFILE } from './data/content'
import { isCoarsePointer } from './lib/env'
import SoundToggle from './SoundToggle'

type Props = { ready: boolean; toast: string | null; onSkip: () => void }

/** Text laid over the 3D room. Only the buttons take pointer events; clicks elsewhere reach the canvas. */
export default function RoomHud({ ready, toast, onSkip }: Props) {
  const touch = isCoarsePointer()
  return (
    <motion.div className="room-hud" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.25 } }}>
      <div className="room-brand">
        <h1 className="room-name">{PROFILE.name}</h1>
        <p className="room-role">{PROFILE.role}</p>
      </div>

      <div className="room-actions">
        <SoundToggle />
        <button className="chip-btn" onClick={onSkip}>
          Skip intro <span aria-hidden="true">›</span>
        </button>
      </div>

      {ready && (
        <p className="room-hint">
          <span className="blink">{touch ? 'TAP THE CABINET' : 'CLICK THE CABINET'}</span>
          {!touch && <span className="room-hint-sub">or press Enter</span>}
        </p>
      )}

      <AnimatePresence>
        {toast && (
          <motion.p
            key={toast}
            className="toast"
            role="status"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            {toast}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

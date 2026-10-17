import { setMotion, useMotion } from './lib/motion'
import { sfx } from './lib/sound'

export default function MotionToggle() {
  const on = useMotion()
  return (
    <button
      className="chip-btn"
      aria-pressed={on}
      onClick={() => {
        setMotion(!on)
        sfx.select()
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M1 9c2-3 4-3 6 0s4 3 6 0" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M1 5c2-3 4-3 6 0s4 3 6 0" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity={on ? 1 : 0.35} />
      </svg>
      Motion {on ? 'on' : 'off'}
    </button>
  )
}

import { setSound, useSound } from './lib/sound'

export default function SoundToggle() {
  const on = useSound()
  return (
    <button className="chip-btn" aria-pressed={on} onClick={() => setSound(!on)}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2 6h3l4-3v10l-4-3H2z" fill="currentColor" />
        {on ? (
          <path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.5 3.5a6 6 0 0 1 0 9" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M11 6l4 4m0-4l-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        )}
      </svg>
      Sound {on ? 'on' : 'off'}
    </button>
  )
}

import { useEffect, useState } from 'react'
import { timeOfDay } from '../lib/timeOfDay'

// Date, time of day and the real moon phase, in the corner like a calendar HUD.

const SYNODIC_MONTH = 29.530588853
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14)

/** 0 = new moon, 0.5 = full moon. */
function moonPhase(date: Date) {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86_400_000
  return (((days % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH) / SYNODIC_MONTH
}

const MOON_NAMES = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent']
const moonName = (f: number) => MOON_NAMES[Math.round(f * 8) % 8]

/** The lit part of the moon: an outer half-circle closed by the terminator's half-ellipse. */
function litPath(f: number, r: number) {
  const k = Math.cos(2 * Math.PI * f)
  const waxing = f < 0.5
  const outerSweep = waxing ? 1 : 0
  const innerSweep = k > 0 === waxing ? 0 : 1
  return `M0 ${-r} A${r} ${r} 0 0 ${outerSweep} 0 ${r} A${Math.abs(k) * r} ${r} 0 0 ${innerSweep} 0 ${-r}Z`
}

export default function Hud({ className = '' }: { className?: string }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const phase = moonPhase(now)
  return (
    <div className={`hud ${className}`} aria-hidden="true">
      <div>
        <div className="hud-date">
          {now.getMonth() + 1}/{now.getDate()}
          <span className={`hud-dow dow-${now.getDay()}`}>{now.toLocaleDateString('en-US', { weekday: 'short' })}</span>
        </div>
        <div className="hud-time">{timeOfDay(now.getHours())}</div>
      </div>
      <svg className="hud-moon" viewBox="-25 -25 50 50">
        <title>{moonName(phase)}</title>
        <circle r="23" className="moon-ring" />
        <circle r="19" className="moon-dark" />
        <path d={litPath(phase, 19)} className="moon-lit" />
      </svg>
    </div>
  )
}

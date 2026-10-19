import { useSyncExternalStore } from 'react'

// Tiny synthesized UI sounds: no audio files, off until the visitor turns them on.

const STORAGE_KEY = 'sound-enabled'
let enabled = false
try {
  enabled = localStorage.getItem(STORAGE_KEY) === '1'
} catch {
  // storage blocked: stay muted
}

const listeners = new Set<() => void>()
let ctx: AudioContext | null = null

function audio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

type ToneOptions = { type?: OscillatorType; volume?: number; slideTo?: number }

function tone(freq: number, delay: number, duration: number, { type = 'square', volume = 0.045, slideTo }: ToneOptions = {}) {
  const a = audio()
  if (!a) return
  const t0 = a.currentTime + delay
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain).connect(a.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

export const sfx = {
  move() {
    if (enabled) tone(1250, 0, 0.035, { volume: 0.025 })
  },
  select() {
    if (!enabled) return
    tone(784, 0, 0.06)
    tone(1175, 0.06, 0.12)
  },
  back() {
    if (enabled) tone(620, 0, 0.1, { type: 'triangle', volume: 0.07, slideTo: 300 })
  },
  coin() {
    if (!enabled) return
    tone(988, 0, 0.08)
    tone(1319, 0.08, 0.45)
  },
  /** glass wind chime: two bright partials with a long ring */
  chime() {
    if (!enabled) return
    tone(2093, 0, 1.6, { type: 'sine', volume: 0.06 })
    tone(3136, 0.01, 1.1, { type: 'sine', volume: 0.025 })
    tone(2637, 0.35, 1.2, { type: 'sine', volume: 0.035 })
  },
  meow() {
    if (!enabled) return
    tone(520, 0, 0.14, { type: 'triangle', volume: 0.06, slideTo: 820 })
    tone(820, 0.14, 0.3, { type: 'triangle', volume: 0.05, slideTo: 430 })
  },
  click() {
    if (enabled) tone(1800, 0, 0.025, { volume: 0.03 })
  },
}

export function setSound(on: boolean) {
  enabled = on
  try {
    localStorage.setItem(STORAGE_KEY, on ? '1' : '0')
  } catch {
    // not persisted; fine
  }
  listeners.forEach((l) => l())
  sfx.select()
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export const useSound = () => useSyncExternalStore(subscribe, () => enabled)

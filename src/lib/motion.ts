import { useSyncExternalStore } from 'react'

// Whether ambient animation runs. Starts from the system's reduced-motion setting, and a
// visitor's own choice (the Motion button) overrides it and is remembered in this browser.

const STORAGE_KEY = 'motion-enabled'
const systemPrefersReduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

let enabled = !systemPrefersReduced
try {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved !== null) enabled = saved === '1'
} catch {
  // storage blocked: follow the system setting
}

const listeners = new Set<() => void>()

/** CSS keys off this attribute to stop its animations. */
function applyToDocument() {
  document.documentElement.dataset.motion = enabled ? 'on' : 'off'
}
applyToDocument()

export const motionEnabled = () => enabled

export function setMotion(on: boolean) {
  enabled = on
  try {
    localStorage.setItem(STORAGE_KEY, on ? '1' : '0')
  } catch {
    // not persisted; fine
  }
  applyToDocument()
  listeners.forEach((l) => l())
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export const useMotion = () => useSyncExternalStore(subscribe, () => enabled)

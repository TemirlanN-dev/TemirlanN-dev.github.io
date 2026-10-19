import { timeOfDay } from '../lib/timeOfDay'

// The monitor's screen: a P3R-blue lock screen with the real clock, then a sign-in screen
// while the camera dives in, so the cut to the menu feels like logging in.

const DISPLAY = '"Barlow Semi Condensed", "Barlow Condensed", sans-serif'
const BODY = 'Barlow, system-ui, sans-serif'
export const LOCK_SCREEN_FONTS = [`800 italic 64px ${DISPLAY}`, `500 32px ${BODY}`, `600 32px ${BODY}`]

export type ScreenMode = 'locked' | 'hover' | 'boot'

export interface ScreenProgram {
  width: number
  height: number
  fps: number
  draw: (ctx: CanvasRenderingContext2D, t: number) => void
}

const W = 1024
const H = 576

function layer() {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  return { canvas, ctx: canvas.getContext('2d')! }
}

/** The menu's water colours: pale cyan top right, indigo bottom left. */
function paintBackground(c: CanvasRenderingContext2D) {
  const g = c.createLinearGradient(W, 0, 0, H)
  g.addColorStop(0, '#7fdcff')
  g.addColorStop(0.45, '#2a73ec')
  g.addColorStop(1, '#1a22b8')
  c.fillStyle = g
  c.fillRect(0, 0, W, H)
  // light shafts from the top right
  c.globalAlpha = 0.12
  c.fillStyle = '#ffffff'
  for (let i = 0; i < 5; i++) {
    const x = 620 + i * 70
    c.beginPath()
    c.moveTo(x, 0)
    c.lineTo(x + 26 + i * 6, 0)
    c.lineTo(x - 180 + i * 8, H)
    c.lineTo(x - 230, H)
    c.fill()
  }
  c.globalAlpha = 1
}

function text(c: CanvasRenderingContext2D, str: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left') {
  c.font = font
  c.textAlign = align
  c.textBaseline = 'alphabetic'
  c.fillStyle = color
  c.fillText(str, x, y)
}

/** The red slash and white blade that mark a selection in the menu. */
function selectionBlade(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  c.fillStyle = '#ff86bd'
  c.beginPath()
  c.moveTo(x + 6, y + h)
  c.lineTo(x + w + 10, y - h * 0.55)
  c.lineTo(x + w - 6, y + h * 0.15)
  c.fill()
  c.fillStyle = '#ffffff'
  c.beginPath()
  c.moveTo(x, y + h)
  c.lineTo(x + w, y - h * 0.5)
  c.lineTo(x + w - 14, y + h * 0.2)
  c.fill()
  c.fillStyle = '#e5232e'
  c.beginPath()
  c.moveTo(x + 4, y + h * 0.78)
  c.lineTo(x + w - 10, y + h * 0.05)
  c.lineTo(x + w - 16, y + h * 0.4)
  c.lineTo(x + 10, y + h)
  c.fill()
}

export function createLockScreen() {
  const background = layer()
  const repaint = () => paintBackground(background.ctx)
  repaint()
  Promise.all(LOCK_SCREEN_FONTS.map((f) => document.fonts.load(f))).then(repaint, () => {})

  let mode: ScreenMode = 'locked'
  let bootAt = 0
  let now = 0

  function drawLocked(c: CanvasRenderingContext2D, t: number) {
    c.drawImage(background.canvas, 0, 0)

    // drifting caustic lines
    c.lineWidth = 2
    for (let k = 0; k < 6; k++) {
      c.strokeStyle = `rgba(255, 255, 255, ${0.07 + (k % 3) * 0.03})`
      c.beginPath()
      for (let x = -20; x <= W + 20; x += 24) {
        const y = 80 + k * 90 + Math.sin(x * 0.012 + t * (0.6 + k * 0.1) + k) * 18 + Math.sin(x * 0.03 - t * 0.8) * 6
        if (x === -20) c.moveTo(x, y)
        else c.lineTo(x, y)
      }
      c.stroke()
    }

    const date = new Date()
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    const day = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()

    // clock and date, left
    c.save()
    c.shadowColor = 'rgba(10, 20, 110, 0.45)'
    c.shadowOffsetX = 5
    c.shadowOffsetY = 5
    text(c, `${hh}:${mm}`, 64, 270, `800 italic 190px ${DISPLAY}`, '#ffffff')
    c.restore()
    text(c, `${date.getMonth() + 1}/${date.getDate()}  ${day}`, 74, 330, `800 italic 46px ${DISPLAY}`, '#ffffff')
    const label = timeOfDay(date.getHours()).toUpperCase()
    c.font = `600 22px ${BODY}`
    const lw = c.measureText(label).width + 28
    c.fillStyle = '#061344'
    c.fillRect(74, 352, lw, 36)
    text(c, label, 88, 378, `600 22px ${BODY}`, '#e8fbff')

    // user, right
    const ax = 800
    const ay = 210
    c.fillStyle = '#ffffff'
    c.beginPath()
    c.arc(ax, ay, 66, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#1438b8'
    c.beginPath()
    c.arc(ax, ay, 58, 0, Math.PI * 2)
    c.fill()
    text(c, 'TN', ax, ay + 22, `800 italic 64px ${DISPLAY}`, '#ffffff', 'center')
    text(c, 'Temirlan', ax, ay + 122, `800 italic 46px ${DISPLAY}`, '#ffffff', 'center')

    const hover = mode === 'hover'
    if (hover) selectionBlade(c, ax - 150, ay + 160, 300, 46)
    if (hover || Math.floor(t * 1.6) % 2 === 0) {
      text(c, hover ? 'CLICK TO LOG IN' : 'Click to log in', ax, ay + 196, `800 italic ${hover ? 40 : 30}px ${DISPLAY}`, hover ? '#07070c' : '#e8fbff', 'center')
    }

    // status bar
    c.fillStyle = 'rgba(255, 255, 255, 0.85)'
    c.fillRect(W - 92, 26, 44, 20)
    c.fillRect(W - 46, 32, 4, 8)
    c.strokeStyle = 'rgba(255, 255, 255, 0.85)'
    c.lineWidth = 3
    for (let r = 1; r <= 3; r++) {
      c.beginPath()
      c.arc(W - 130, 46, r * 7, Math.PI * 1.25, Math.PI * 1.75)
      c.stroke()
    }
  }

  function drawBoot(c: CanvasRenderingContext2D, b: number) {
    c.drawImage(background.canvas, 0, 0)
    c.fillStyle = 'rgba(6, 19, 68, 0.35)'
    c.fillRect(0, 0, W, H)
    text(c, 'Welcome back, Temirlan', W / 2, H / 2 - 20, `800 italic 64px ${DISPLAY}`, '#ffffff', 'center')
    const barW = 420
    const x = (W - barW) / 2
    c.fillStyle = 'rgba(255, 255, 255, 0.25)'
    c.fillRect(x, H / 2 + 20, barW, 8)
    c.fillStyle = '#ffffff'
    c.fillRect(x, H / 2 + 20, barW * Math.min(1, b / 1.3), 8)
    if (b < 0.25) {
      c.fillStyle = `rgba(255, 255, 255, ${1 - b / 0.25})`
      c.fillRect(0, 0, W, H)
    }
  }

  return {
    width: W,
    height: H,
    fps: 24,
    draw(c: CanvasRenderingContext2D, t: number) {
      now = t
      if (mode === 'boot') drawBoot(c, t - bootAt)
      else drawLocked(c, t)
    },
    setMode(next: ScreenMode) {
      if (next === mode) return
      if (next === 'boot') bootAt = now
      mode = next
    },
  } satisfies ScreenProgram & { setMode: (m: ScreenMode) => void }
}

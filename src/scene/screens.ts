// What the arcade screens, marquees and wall signs show, drawn with the 2D canvas API.

const PIXEL = '"Press Start 2P", monospace'
export const PIXEL_FONT = `32px ${PIXEL}`
export const NEON_FONT = '64px Monoton'

export interface ScreenProgram {
  width: number
  height: number
  fps: number
  draw: (ctx: CanvasRenderingContext2D, t: number) => void
}

function layer(w: number, h: number) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return { canvas, ctx: canvas.getContext('2d')! }
}

/** Scanlines and a dark vignette, laid over every screen. */
function crtOverlay(w: number, h: number) {
  const { canvas, ctx } = layer(w, h)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 2)
  const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.9)
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.6)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)
  return canvas
}

function pixelText(
  ctx: CanvasRenderingContext2D,
  str: string,
  x: number,
  y: number,
  size: number,
  color: string,
  { glow = 0, glowColor = color, align = 'center' as CanvasTextAlign } = {},
) {
  ctx.font = `${size}px ${PIXEL}`
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.shadowColor = glowColor
  ctx.shadowBlur = glow
  ctx.fillText(str, x, y)
  ctx.shadowBlur = 0
}

export type MainScreenMode = 'attract' | 'hover' | 'boot'

/** The main cabinet: a moonlit attract screen, then a boot screen as the camera dives in. */
export function createMainScreen() {
  const W = 1024
  const H = 640
  const HORIZON = 392
  const overlay = crtOverlay(W, H)
  const titles = layer(W, H)

  const paintTitles = () => {
    const c = titles.ctx
    c.clearRect(0, 0, W, H)
    pixelText(c, '1UP', 48, 52, 18, '#ff5fa8', { align: 'left' })
    pixelText(c, '000000', 48, 82, 18, '#eaffff', { align: 'left' })
    pixelText(c, 'HI-SCORE', W - 48, 52, 18, '#ff5fa8', { align: 'right' })
    pixelText(c, '002026', W - 48, 82, 18, '#eaffff', { align: 'right' })
    pixelText(c, 'TEMIRLAN', W / 2, 158, 66, '#f2feff', { glow: 28, glowColor: '#4de1ff' })
    pixelText(c, 'NURMAMBETOV', W / 2, 228, 30, '#9fdcff', { glow: 14, glowColor: '#2f8dff' })
    pixelText(c, 'SOFTWARE ENGINEER / UBC CS', W / 2, 272, 15, '#6fb6ff')
    pixelText(c, '(C) 2026 TEMIRLAN-DEV', W / 2, H - 34, 12, 'rgba(170, 205, 255, 0.75)')
  }
  paintTitles()
  document.fonts.load(PIXEL_FONT).then(paintTitles, () => {})

  let mode: MainScreenMode = 'attract'
  let bootAt = 0
  let now = 0

  function drawAttract(c: CanvasRenderingContext2D, t: number) {
    const sky = c.createLinearGradient(0, 0, 0, HORIZON)
    sky.addColorStop(0, '#01041a')
    sky.addColorStop(1, '#0c2470')
    c.fillStyle = sky
    c.fillRect(0, 0, W, HORIZON)

    for (let i = 0; i < 60; i++) {
      const x = (i * 157.3) % W
      const y = 10 + ((i * 91.7) % (HORIZON - 130))
      c.fillStyle = `rgba(200, 230, 255, ${0.3 + 0.3 * Math.sin(t * 2 + i)})`
      c.fillRect(x, y, 3, 3)
    }

    // the moon, half sunk below the horizon, with retro cut lines
    const mx = W / 2
    const my = HORIZON + 5
    const mr = 92
    const halo = c.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 2.4)
    halo.addColorStop(0, 'rgba(110, 200, 255, 0.4)')
    halo.addColorStop(1, 'rgba(110, 200, 255, 0)')
    c.fillStyle = halo
    c.fillRect(0, 0, W, HORIZON)
    const moon = c.createLinearGradient(0, my - mr, 0, my)
    moon.addColorStop(0, '#f4feff')
    moon.addColorStop(1, '#78ccff')
    c.fillStyle = moon
    c.beginPath()
    c.arc(mx, my, mr, Math.PI, 0)
    c.fill()
    c.fillStyle = '#0c2470'
    for (let i = 0; i < 5; i++) c.fillRect(mx - mr, my - 48 + i * 11, mr * 2, 1.5 + i * 1.3)

    // scrolling grid floor
    c.fillStyle = '#020617'
    c.fillRect(0, HORIZON, W, H - HORIZON)
    c.strokeStyle = 'rgba(77, 225, 255, 0.7)'
    c.lineWidth = 2
    c.beginPath()
    for (let i = -16; i <= 16; i++) {
      c.moveTo(W / 2 + i * 16, HORIZON)
      c.lineTo(W / 2 + i * 110, H)
    }
    const scroll = (t * 0.5) % 1
    for (let k = 0; k < 12; k++) {
      const f = (k + scroll) / 12
      const y = HORIZON + (H - HORIZON) * f * f
      c.moveTo(0, y)
      c.lineTo(W, y)
    }
    c.stroke()
    c.fillStyle = '#bff3ff'
    c.fillRect(0, HORIZON - 1, W, 2)

    c.drawImage(titles.canvas, 0, 0)

    const hover = mode === 'hover'
    if (Math.floor(t * (hover ? 6 : 2)) % 2 === 0) {
      c.fillStyle = 'rgba(2, 6, 23, 0.75)'
      c.fillRect(W / 2 - 230, 512, 460, 54)
      pixelText(c, 'PRESS START', W / 2, 540, 28, '#ffffff', { glow: 18, glowColor: '#4de1ff' })
    }
    if (hover) {
      c.fillStyle = '#5fe3ff'
      for (const dir of [-1, 1]) {
        const x = W / 2 + dir * 262
        c.beginPath()
        c.moveTo(x - dir * 16, 524)
        c.lineTo(x + dir * 4, 540)
        c.lineTo(x - dir * 16, 556)
        c.fill()
      }
    }

    c.drawImage(overlay, 0, 0)
  }

  function drawBoot(c: CanvasRenderingContext2D, b: number) {
    const bg = c.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, '#1240b8')
    bg.addColorStop(1, '#061344')
    c.fillStyle = bg
    c.fillRect(0, 0, W, H)
    pixelText(c, 'NOW LOADING', W / 2, H / 2 - 40, 30, '#e8fbff', { glow: 12, glowColor: '#5fe3ff' })
    const barW = 540
    const barX = (W - barW) / 2
    const barY = H / 2 + 10
    c.strokeStyle = '#e8fbff'
    c.lineWidth = 4
    c.strokeRect(barX, barY, barW, 40)
    c.fillStyle = '#5fe3ff'
    const blocks = Math.floor(Math.min(1, b / 1.4) * 20)
    for (let i = 0; i < blocks; i++) c.fillRect(barX + 10 + i * 26, barY + 10, 20, 20)
    c.drawImage(overlay, 0, 0)
    if (b < 0.3) {
      c.fillStyle = `rgba(255, 255, 255, ${1 - b / 0.3})`
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
      else drawAttract(c, t)
    },
    setMode(next: MainScreenMode) {
      if (next === mode) return
      if (next === 'boot') bootAt = now
      mode = next
    },
  } satisfies ScreenProgram & { setMode: (m: MainScreenMode) => void }
}

/** A two-player paddle game playing itself. */
export function createPaddleScreen(): ScreenProgram {
  const W = 512
  const H = 320
  const overlay = crtOverlay(W, H)
  const triangle = (x: number) => 1 - Math.abs((((x % 2) + 2) % 2) - 1)
  let left = H / 2
  let right = H / 2

  return {
    width: W,
    height: H,
    fps: 24,
    draw(c, t) {
      c.fillStyle = '#0a0310'
      c.fillRect(0, 0, W, H)
      c.fillStyle = 'rgba(255, 79, 163, 0.55)'
      for (let y = 8; y < H; y += 24) c.fillRect(W / 2 - 2, y, 4, 12)
      const bx = 40 + (W - 80) * triangle(t * 0.5)
      const by = 24 + (H - 48) * triangle(t * 0.77 + 0.3)
      left += (by - left) * (bx < W / 2 ? 0.2 : 0.05)
      right += (by - right) * (bx > W / 2 ? 0.2 : 0.05)
      c.fillStyle = '#ffd6ec'
      c.fillRect(22, left - 30, 10, 60)
      c.fillRect(W - 32, right - 30, 10, 60)
      c.fillRect(bx - 6, by - 6, 12, 12)
      pixelText(c, '07', W / 2 - 70, 40, 28, '#ff8cc6')
      pixelText(c, '11', W / 2 + 70, 40, 28, '#ff8cc6')
      c.drawImage(overlay, 0, 0)
    },
  }
}

/** Static noise and a blinking sign. */
export function createOutOfOrderScreen(): ScreenProgram {
  const W = 512
  const H = 320
  const overlay = crtOverlay(W, H)
  const noise = layer(128, 80)
  const pixels = noise.ctx.createImageData(128, 80)

  return {
    width: W,
    height: H,
    fps: 12,
    draw(c, t) {
      const d = pixels.data
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 70
        d[i] = v
        d[i + 1] = v * 0.9
        d[i + 2] = v * 0.7
        d[i + 3] = 255
      }
      noise.ctx.putImageData(pixels, 0, 0)
      c.imageSmoothingEnabled = false
      c.drawImage(noise.canvas, 0, 0, W, H)
      c.fillStyle = 'rgba(0, 0, 0, 0.5)'
      c.fillRect(0, H / 2 - 40, W, 80)
      if (Math.floor(t * 1.5) % 2 === 0) pixelText(c, 'OUT OF ORDER', W / 2, H / 2, 26, '#ffb23f', { glow: 14, glowColor: '#ff8a00' })
      c.drawImage(overlay, 0, 0)
    },
  }
}

function fitFont(ctx: CanvasRenderingContext2D, label: string, family: string, size: number, maxWidth: number) {
  ctx.font = `${size}px ${family}`
  const width = ctx.measureText(label).width
  if (width > maxWidth) ctx.font = `${size * (maxWidth / width)}px ${family}`
}

/** The lit sign above a cabinet's screen. */
export function paintMarquee(c: CanvasRenderingContext2D, w: number, h: number, label: string, accent: string) {
  const bg = c.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#0b0820')
  bg.addColorStop(1, '#1a0f3a')
  c.fillStyle = bg
  c.fillRect(0, 0, w, h)

  c.globalAlpha = 0.16
  c.fillStyle = accent
  for (let i = 0; i <= 8; i++) {
    c.beginPath()
    c.moveTo(w / 2, h * 1.5)
    c.lineTo((i * w) / 8 - 36, 0)
    c.lineTo((i * w) / 8 + 36, 0)
    c.fill()
  }
  c.globalAlpha = 1

  c.textAlign = 'center'
  c.textBaseline = 'middle'
  fitFont(c, label, 'Monoton', h * 0.46, w * 0.88)
  c.shadowColor = accent
  c.shadowBlur = 30
  c.fillStyle = accent
  c.fillText(label, w / 2, h / 2 + 6)
  c.shadowBlur = 10
  c.fillStyle = '#ffffff'
  c.fillText(label, w / 2, h / 2 + 6)
  c.shadowBlur = 0

  c.fillStyle = accent
  c.fillRect(0, 12, w, 4)
  c.fillRect(0, h - 16, w, 4)
}

/** Neon-tube lettering on a transparent background. */
export function paintNeon(c: CanvasRenderingContext2D, w: number, h: number, label: string, family: string, color: string) {
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  fitFont(c, label, family, h * 0.62, w * 0.9)
  c.shadowColor = color
  c.fillStyle = color
  c.shadowBlur = 36
  c.fillText(label, w / 2, h / 2)
  c.shadowBlur = 14
  c.fillText(label, w / 2, h / 2)
  c.shadowBlur = 4
  c.globalAlpha = 0.85
  c.fillStyle = '#ffffff'
  c.fillText(label, w / 2, h / 2)
  c.globalAlpha = 1
  c.shadowBlur = 0
}

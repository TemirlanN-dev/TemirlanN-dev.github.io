import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function makeCanvasTexture(w: number, h: number) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return { ctx: canvas.getContext('2d')!, texture }
}

/** A canvas texture redrawn by `draw` at up to `fps` frames per second. */
export function useAnimatedTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, t: number) => void, fps: number) {
  const target = useMemo(() => makeCanvasTexture(w, h), [w, h])
  const sinceDraw = useRef(Infinity)
  // our own clock: R3F's resets when the frame loop restarts, which would rewind the screen
  const time = useRef(0)

  useFrame((_, delta) => {
    time.current += Math.min(delta, 0.1)
    sinceDraw.current += delta
    if (sinceDraw.current < 1 / fps) return
    sinceDraw.current = 0
    draw(target.ctx, time.current)
    target.texture.needsUpdate = true
  })

  useEffect(() => () => target.texture.dispose(), [target])
  return target.texture
}

/** A canvas texture painted once, then again once the given fonts have loaded. */
export function useStaticTexture(w: number, h: number, paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, fonts: string[]) {
  const target = useMemo(() => makeCanvasTexture(w, h), [w, h])
  const paintRef = useRef(paint)
  paintRef.current = paint
  const fontKey = fonts.join('|')

  useEffect(() => {
    let alive = true
    const repaint = () => {
      if (!alive) return
      target.ctx.clearRect(0, 0, w, h)
      paintRef.current(target.ctx, w, h)
      target.texture.needsUpdate = true
    }
    repaint()
    Promise.all(fontKey.split('|').map((f) => document.fonts.load(f))).then(repaint, () => {})
    return () => {
      alive = false
    }
  }, [target, w, h, fontKey])

  useEffect(() => () => target.texture.dispose(), [target])
  return target.texture
}

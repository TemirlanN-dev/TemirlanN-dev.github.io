import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../lib/env'

// A full-screen fragment shader: deep blue water with drifting caustics and light shafts.
// Plain WebGL (no three.js) so the menu stays light when visited without the arcade.

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`

const FRAGMENT = `
precision mediump float;
uniform vec2 uResolution;
uniform float uTime;

// bright where two warped wave fields cross: reads as light focused by a rippling surface
float caustic(vec2 p, float t) {
  vec2 q = p + 0.45 * vec2(sin(p.y * 1.3 + t * 0.8), cos(p.x * 1.1 - t * 0.6));
  q += 0.25 * vec2(sin(q.y * 2.7 - t * 1.1), cos(q.x * 2.3 + t * 0.9));
  float a = sin(q.x * 2.0 + t * 0.5) * sin(q.y * 2.4 - t * 0.4);
  return pow(1.0 - abs(a), 12.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float t = uTime;

  vec3 deep = vec3(0.008, 0.03, 0.14);
  vec3 lit = vec3(0.05, 0.2, 0.62);
  vec3 color = mix(deep, lit, smoothstep(0.0, 1.2, uv.y * 0.75 + uv.x * 0.45));

  float c = caustic(p * 2.6, t * 0.5) * 0.65 + caustic(p * 4.8 + 7.0, t * 0.7) * 0.45;
  color += vec3(0.3, 0.75, 1.0) * c * 0.32;

  float shafts = pow(0.5 + 0.5 * sin((p.x * 0.8 + p.y) * 5.0 - t * 0.25), 8.0);
  color += vec3(0.15, 0.35, 0.8) * shafts * 0.18 * uv.y;

  color *= 0.6 + 0.4 * smoothstep(1.4, 0.1, length(uv - vec2(0.62, 0.7)));
  gl_FragColor = vec4(color, 1.0);
}
`

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
}

export default function WaterBackground() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { antialias: false, depth: false, alpha: false })
    const vs = gl && compile(gl, gl.VERTEX_SHADER, VERTEX)
    const fs = gl && compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
    if (!gl || !vs || !fs) {
      canvas.classList.add('is-fallback')
      return
    }

    const program = gl.createProgram()!
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.useProgram(program)

    // one triangle that covers the whole viewport
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    const uResolution = gl.getUniformLocation(program, 'uResolution')
    const uTime = gl.getUniformLocation(program, 'uTime')

    // half resolution: the pattern is soft, and this keeps phones cool
    const scale = Math.min(window.devicePixelRatio || 1, 2) * 0.5
    const still = prefersReducedMotion()
    const start = performance.now()
    let raf = 0

    const frame = (now: number) => {
      const w = Math.max(1, Math.round(canvas.clientWidth * scale))
      const h = Math.max(1, Math.round(canvas.clientHeight * scale))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
      gl.uniform2f(uResolution, w, h)
      gl.uniform1f(uTime, 20 + (still ? 0 : (now - start) / 1000))
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (!still) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const onResize = () => {
      if (still) raf = requestAnimationFrame(frame)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      // free the GPU context once the canvas is really gone (not on a StrictMode re-run)
      setTimeout(() => {
        if (!canvas.isConnected) gl.getExtension('WEBGL_lose_context')?.loseContext()
      }, 0)
    }
  }, [])

  return <canvas ref={ref} className="water" aria-hidden="true" />
}

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMotion } from '../lib/motion'
import type { Daylight } from './daylight'
import { SEA } from './layout'

// The sky out of the window, painted by a shader on a big backdrop: anime-style cel-shaded
// clouds, hazy islands, stars, and the sun or moon, all following the time of day. The sea
// itself is real geometry (Sea.tsx); below the horizon this only paints haze behind it.
//
// The backdrop travels with the camera, so like a real sky it never shifts as you move, and
// its horizon is lowered to sit exactly on the far edge of the sea.

const WIDTH = 44
const HEIGHT = 26
const DISTANCE = 16 // metres in front of the camera

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uSkyTop, uSkyHorizon, uBodyColor, uCloudLit, uCloudShade, uSeaFar, uHaze, uIsland;
uniform vec2 uBody;
uniform float uBodySize, uMoon, uStars;
varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.02 + 17.3;
    a *= 0.5;
  }
  return v;
}

// cumulus: noise squeezed into towers that sit on a flat-ish base just above the horizon
float cloudField(vec2 q) {
  float n = fbm(vec2(q.x * 0.28 + uTime * 0.025, q.y * 0.5));
  float band = smoothstep(0.15, 0.7, q.y) * smoothstep(4.6, 1.2, q.y);
  return n * band;
}

void main() {
  // metres on the backdrop, centred on the horizon
  vec2 q = (vUv - 0.5) * vec2(${WIDTH.toFixed(1)}, ${HEIGHT.toFixed(1)});
  vec3 col;

  if (q.y > 0.0) {
    col = mix(uSkyHorizon, uSkyTop, smoothstep(0.0, 1.0, q.y / 4.5));

    // stars, twinkling, fading out toward the hazy horizon
    vec2 cell = floor(q * 9.0);
    float star = step(0.985, hash(cell)) * smoothstep(0.4, 1.6, q.y);
    float twinkle = 0.6 + 0.4 * sin(uTime * 2.0 + hash(cell + 7.0) * 30.0);
    vec2 inCell = fract(q * 9.0) - 0.5;
    col += vec3(1.0) * star * twinkle * smoothstep(0.12, 0.0, length(inCell)) * uStars;

    // sun (bright, blooming) or moon (crisp disc with soft craters)
    float d = length(q - uBody);
    float disc = smoothstep(uBodySize, uBodySize - 0.03, d);
    vec3 sun = uBodyColor * (0.55 * exp(-d * 0.9) + 1.6 * disc);
    float craters = 0.85 + 0.15 * smoothstep(0.45, 0.6, noise((q - uBody) * 4.0 / uBodySize));
    vec3 moon = mix(col + uBodyColor * 0.35 * exp(-d * 1.4), uBodyColor * craters * 1.15, disc);
    col = mix(col + sun, moon, uMoon);

    // distant islands in haze
    float island = 0.42 * exp(-pow((q.x + 3.6) / 1.1, 2.0)) + 0.26 * exp(-pow((q.x + 2.3) / 0.7, 2.0)) + 0.18 * exp(-pow((q.x - 5.2) / 0.9, 2.0));
    if (q.y < island) col = mix(uIsland, mix(uIsland, uHaze, 0.5), q.y / max(island, 0.01));

    // cel-shaded clouds: lit where they face the sun or moon, a flat shadow on the far side
    float density = cloudField(q);
    float body = smoothstep(0.43, 0.445, density);
    float towardLight = cloudField(q + normalize(uBody - q) * 0.22);
    float shade = smoothstep(0.47, 0.49, towardLight) * smoothstep(0.43, 0.5, density);
    vec3 cloud = mix(uCloudLit, uCloudShade, shade);
    cloud = mix(cloud, mix(uCloudShade, uCloudLit, 0.4), smoothstep(1.0, 0.25, q.y) * 0.5);
    col = mix(col, cloud, body);

  } else {
    // behind the real sea: haze at the horizon deepening to far-sea blue
    col = mix(uHaze, uSeaFar, smoothstep(0.0, 1.5, -q.y));
  }

  // authored in sRGB; the renderer works in linear light
  gl_FragColor = vec4(pow(max(col, 0.0), vec3(2.2)), 1.0);
}
`

const COLOR_UNIFORMS = ['SkyTop', 'SkyHorizon', 'BodyColor', 'CloudLit', 'CloudShade', 'SeaFar', 'Haze', 'Island'] as const

export default function WindowView({ daylight }: { daylight: Daylight }) {
  const motion = useMotion()
  // R3F copies the `uniforms` prop into the material's own objects, so updates must go to
  // material.uniforms; writing to the object we passed in never reaches the GPU
  const material = useRef<THREE.ShaderMaterial>(null)
  const initialUniforms = useMemo(() => {
    const u: Record<string, THREE.IUniform> = {
      uTime: { value: 30 },
      uBody: { value: new THREE.Vector2() },
      uBodySize: { value: 0.4 },
      uMoon: { value: 0 },
      uStars: { value: 0 },
    }
    for (const name of COLOR_UNIFORMS) u[`u${name}`] = { value: new THREE.Color() }
    return u
  }, [])

  // the shader works in sRGB, while THREE.Color keeps linear values
  useEffect(() => {
    if (!material.current) return
    const uniforms = material.current.uniforms
    const s = daylight.sky
    const colors: Record<(typeof COLOR_UNIFORMS)[number], THREE.Color> = {
      SkyTop: s.top,
      SkyHorizon: s.horizon,
      BodyColor: s.bodyColor,
      CloudLit: s.cloudLit,
      CloudShade: s.cloudShade,
      SeaFar: s.seaFar,
      Haze: s.haze,
      Island: s.island,
    }
    for (const name of COLOR_UNIFORMS) (uniforms[`u${name}`].value as THREE.Color).copy(colors[name]).convertLinearToSRGB()
    ;(uniforms.uBody.value as THREE.Vector2).copy(s.body)
    uniforms.uBodySize.value = s.bodySize
    uniforms.uMoon.value = s.moon
    uniforms.uStars.value = s.stars
  }, [daylight])

  const backdrop = useRef<THREE.Mesh>(null)
  useFrame(({ camera }, delta) => {
    if (motion && material.current) material.current.uniforms.uTime.value += Math.min(delta, 0.1)
    if (!backdrop.current) return
    // the sea's far edge sits a hair below eye level; drop the painted horizon to meet it
    const dip = (camera.position.y - SEA.level) / (camera.position.z - SEA.far)
    backdrop.current.position.set(camera.position.x, camera.position.y - dip * DISTANCE, camera.position.z - DISTANCE)
  })

  // drawn first and never writes depth, so the sea and the room always draw over it
  return (
    <mesh ref={backdrop} renderOrder={-1}>
      <planeGeometry args={[WIDTH, HEIGHT]} />
      <shaderMaterial ref={material} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={initialUniforms} toneMapped={false} depthWrite={false} />
    </mesh>
  )
}

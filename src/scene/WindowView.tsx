import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMotion } from '../lib/motion'
import type { Daylight } from './daylight'

// The view out of the window: the sea, painted by a shader on a big backdrop far outside, so
// it shifts with the camera like real distance. Anime-style cel-shaded clouds, hazy islands,
// rolling swells and a little sailboat; sky, sun or moon, and colours follow the time of day.

const WIDTH = 24
const HEIGHT = 12
const DISTANCE = 12 // metres behind the back wall
const EYE_LEVEL = 1.45 // the horizon sits at the camera's height, as it does in real life

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uSkyTop, uSkyHorizon, uBodyColor, uCloudLit, uCloudShade, uSeaNear, uSeaFar, uGlitter, uHaze, uIsland;
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
  // metres on the backdrop; it is centred at eye level, so the horizon is y = 0
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

    // a sailboat working its way along the horizon
    float bx = mod(uTime * 0.12, 16.0) - 8.0;
    vec2 b = q - vec2(bx, 0.0);
    float sail = step(0.0, b.y) * step(b.y, 0.32) * step(abs(b.x - 0.02), 0.12 * (1.0 - b.y / 0.32));
    float hull = step(abs(b.x), 0.16) * step(-0.05, b.y) * step(b.y, 0.02);
    col = mix(col, mix(uCloudLit, vec3(1.0), 0.5), sail);
    col = mix(col, uIsland * 0.6, hull);
  } else {
    // sea: rows closer to the horizon are further away, so detail compresses toward it
    float depth = -q.y;
    float z = 1.0 / (depth + 0.06);
    vec2 w = vec2(q.x * z * 0.6, z * 1.2);
    col = mix(uSeaFar, uSeaNear, smoothstep(0.0, 2.2, depth));

    // swells rolling in toward the shore: lighter crests, darker troughs
    float roll = uTime;
    float swell = 0.6 * sin(w.y * 2.2 - roll * 1.5 + noise(w * 0.8 + roll * 0.08) * 4.0)
                + 0.4 * sin(w.y * 3.7 + w.x * 0.6 - roll * 2.0 + noise(w * 1.3 - roll * 0.12) * 3.0);
    col *= 0.88 + 0.16 * swell;
    col = mix(col, uGlitter, smoothstep(0.8, 0.97, swell) * 0.28);

    // whitecaps drifting with the swell
    float caps = noise(vec2(w.x * 3.0 + roll * 0.25, w.y * 2.0 - roll * 1.3));
    col = mix(col, mix(uGlitter, vec3(1.0), 0.5), smoothstep(0.8, 0.85, caps) * smoothstep(0.3, 1.4, depth) * 0.55);

    // glitter, strongest in the path of the sun or moon
    float column = exp(-pow((q.x - uBody.x) * 0.55, 2.0)) * step(-0.2, uBody.y);
    float glitter = max(noise(vec2(w.x * 7.0, w.y * 5.0 - uTime * 1.6)), noise(vec2(w.x * 9.0 + 3.0, w.y * 6.0 + uTime * 1.2)));
    col += uGlitter * smoothstep(0.86 - column * 0.2, 0.92 - column * 0.2, glitter) * (0.45 + column);

    // haze where sea meets sky
    col = mix(col, uHaze, exp(-depth * 9.0) * 0.7);
  }

  // authored in sRGB; the renderer works in linear light
  gl_FragColor = vec4(pow(max(col, 0.0), vec3(2.2)), 1.0);
}
`

const COLOR_UNIFORMS = ['SkyTop', 'SkyHorizon', 'BodyColor', 'CloudLit', 'CloudShade', 'SeaNear', 'SeaFar', 'Glitter', 'Haze', 'Island'] as const

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
      SeaNear: s.seaNear,
      SeaFar: s.seaFar,
      Glitter: s.glitter,
      Haze: s.haze,
      Island: s.island,
    }
    for (const name of COLOR_UNIFORMS) (uniforms[`u${name}`].value as THREE.Color).copy(colors[name]).convertLinearToSRGB()
    ;(uniforms.uBody.value as THREE.Vector2).copy(s.body)
    uniforms.uBodySize.value = s.bodySize
    uniforms.uMoon.value = s.moon
    uniforms.uStars.value = s.stars
  }, [daylight])

  useFrame((_, delta) => {
    if (motion && material.current) material.current.uniforms.uTime.value += Math.min(delta, 0.1)
  })

  return (
    <mesh position={[0, EYE_LEVEL, -1.2 - DISTANCE]}>
      <planeGeometry args={[WIDTH, HEIGHT]} />
      <shaderMaterial ref={material} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={initialUniforms} toneMapped={false} />
    </mesh>
  )
}

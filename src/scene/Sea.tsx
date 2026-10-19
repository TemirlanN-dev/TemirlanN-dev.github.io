import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMotion } from '../lib/motion'
import type { Daylight } from './daylight'
import { SEA } from './layout'

// The sea outside the window: a real surface whose vertices are moved by layered Gerstner
// waves, so the water rises into crests and falls into troughs. One long swell dominates;
// wave heights come and go in drifting sets and the crests are bent, so no two waves match.
// Everything travels sideways (never toward the viewer), and it is cel-shaded like the room:
// flat tones by how each face meets the sun or moon, foam on the crests, glints in the
// light's path, fading into haze at the horizon.

/** Rows get further apart with distance, so detail is spent where the eye can see it. */
function buildSurface() {
  const cols = 140
  const rows = 120
  const positions = new Float32Array((cols + 1) * (rows + 1) * 3)
  const ratio = SEA.far / SEA.near
  let k = 0
  for (let r = 0; r <= rows; r++) {
    const z = SEA.near * Math.pow(ratio, r / rows)
    const half = 15 + 0.75 * -z // the window sees a wider strip further out
    for (let c = 0; c <= cols; c++) {
      positions[k++] = -half + (2 * half * c) / cols
      positions[k++] = 0
      positions[k++] = z
    }
  }
  const indices: number[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c
      const b = a + 1
      const d = a + cols + 1
      const e = d + 1
      indices.push(a, b, d, b, e, d) // counter-clockwise seen from above
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  // the waves move vertices a little; keep the far sea from being culled at the frustum edge
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, SEA.far / 2), -SEA.far)
  return geometry
}

const vertexShader = /* glsl */ `
uniform float uTime;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vHeight;

#define PI 3.14159265

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

// One Gerstner wave. xy: direction of travel, z: steepness, w: wavelength in metres.
vec3 wave(vec4 w, vec2 p, float scale) {
  float k = 2.0 * PI / w.w;
  float speed = sqrt(9.8 / k) * 0.42; // deep-water speed, slowed for a lazy afternoon
  vec2 d = normalize(w.xy);
  float a = w.z * scale / k;
  float f = k * (dot(d, p) - speed * uTime);
  return vec3(d.x * a * cos(f), a * sin(f), d.y * a * cos(f));
}

// Real seas come in sets: patches of tall waves between calmer water. A slow noise field
// scales each wave's height (0.22 to 1) and drifts left to right at about half the wave
// speed, the way wave groups travel.
float groups(vec2 p, vec2 seed, float groupSpeed) {
  vec2 q = p - vec2(uTime * groupSpeed, 0.0);
  float n = noise(q * 0.018 + seed) * 0.65 + noise(q * 0.047 + seed * 1.7) * 0.35;
  return mix(0.22, 1.0, smoothstep(0.3, 0.7, n));
}

// The slowly varying parts of the sea at a spot: how much each wave is in a set, and how far
// the crest lines are bent there. Computed once per vertex and shared by its slope samples.
struct Swell { vec4 amp; float ripple; vec2 bend; };

Swell swellAt(vec2 p, float dist) {
  Swell s;
  s.amp = vec4(
    groups(p, vec2(0.0), 1.4) * (1.0 - smoothstep(200.0, 400.0, dist)),
    groups(p, vec2(5.3, 1.1), 1.1) * (1.0 - smoothstep(140.0, 300.0, dist)),
    groups(p, vec2(2.2, 7.4), 0.9) * (1.0 - smoothstep(80.0, 180.0, dist)),
    groups(p, vec2(9.1, 3.3), 0.6) * (1.0 - smoothstep(40.0, 100.0, dist)));
  s.ripple = 1.0 - smoothstep(25.0, 60.0, dist);
  s.bend = (vec2(noise(p * 0.021 + 3.1), noise(p * 0.021 + 8.7)) - 0.5) * 10.0;
  return s;
}

// Height and sideways shift of the water at p. All waves travel left to right (+x).
vec3 surface(vec2 p, Swell s) {
  vec2 q = p + s.bend; // bent crest lines: no two are straight or parallel
  vec3 o = wave(vec4(1.0, -0.22, 0.24, 31.0), q, s.amp.x);
  o += wave(vec4(1.0, 0.42, 0.16, 18.7), q, s.amp.y);
  o += wave(vec4(0.75, -0.66, 0.1, 10.9), q, s.amp.z);
  o += wave(vec4(1.0, 0.12, 0.06, 5.9), q, s.amp.w);
  o += wave(vec4(0.6, 0.8, 0.04, 3.4), q, s.ripple);
  return o;
}

void main() {
  vec3 base = (modelMatrix * vec4(position, 1.0)).xyz;
  float dist = length(base.xz - cameraPosition.xz);
  Swell s = swellAt(base.xz, dist);
  vec3 P = base + surface(base.xz, s);
  // the wave heights vary across the water, so measure the real slope for the normal
  float e = 0.35 + dist * 0.004;
  vec3 Px = base + vec3(e, 0.0, 0.0) + surface(base.xz + vec2(e, 0.0), s);
  vec3 Pz = base + vec3(0.0, 0.0, e) + surface(base.xz + vec2(0.0, e), s);
  vNormal = normalize(cross(Pz - P, Px - P));
  vHeight = P.y - base.y;
  vWorld = P;
  gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
}
`

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uSeaNear, uSeaFar, uGlitter, uHaze, uSkyHorizon;
uniform vec3 uLightDir; // toward the sun or moon
uniform float uLightUp; // 0 once it has set
varying vec3 vWorld;
varying vec3 vNormal;
varying float vHeight;

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

void main() {
  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWorld);
  float dist = length(vWorld.xz - cameraPosition.xz);

  // cel shading: three flat tones by how far each face tilts toward or away from the light,
  // measured against flat water so gentle slopes still read; troughs a step darker
  vec3 shadeDir = normalize(vec3(uLightDir.x, max(uLightDir.y, 0.2), uLightDir.z));
  float tilt = dot(N, shadeDir) - shadeDir.y;
  float tone = tilt > 0.05 ? 1.18 : (tilt > -0.05 ? 0.95 : 0.72);
  tone *= vHeight < -0.25 ? 0.88 : 1.0;
  vec3 col = mix(uSeaNear, uSeaFar, smoothstep(15.0, 260.0, dist) * 0.7) * tone;

  // faces seen edge-on reflect the bright sky near the horizon
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0);
  col = mix(col, uSkyHorizon, fresnel * 0.28);

  // foam on the crests, broken up and drifting with the water
  float breakup = noise(vWorld.xz * 0.9 + vec2(uTime * 0.5, 0.0));
  float foam = step(0.6 + 0.3 * breakup, vHeight) * step(0.35, fract(breakup * 5.0)) * (1.0 - smoothstep(50.0, 160.0, dist));
  col = mix(col, mix(uGlitter, vec3(1.0), 0.4), foam * 0.8);

  // hard-edged glints where a wave tilts the sun or moon straight at the eye
  vec3 R = reflect(-uLightDir, N);
  float facing = dot(R, V);
  float sparkle = noise(vWorld.xz * 2.2 + vec2(uTime * 1.4, uTime * 0.3));
  float glint = step(0.995 - 0.01 * sparkle, facing) * step(0.64, sparkle);
  col += uGlitter * (glint * 1.4 + pow(max(facing, 0.0), 200.0) * 0.12) * uLightUp;

  // haze toward the horizon, reaching the sky's horizon colour at the far edge
  float haze = max(1.0 - exp(-dist / 260.0), smoothstep(300.0, 415.0, dist));
  col = mix(col, uHaze, haze);

  // authored in sRGB, like the sky; the renderer works in linear light
  gl_FragColor = vec4(pow(max(col, 0.0), vec3(2.2)), 1.0);
}
`

const COLORS = ['SeaNear', 'SeaFar', 'Glitter', 'Haze', 'SkyHorizon'] as const

export default function Sea({ daylight }: { daylight: Daylight }) {
  const motion = useMotion()
  const geometry = useMemo(buildSurface, [])
  useEffect(() => () => geometry.dispose(), [geometry])

  // R3F copies the `uniforms` prop into the material, so updates go to material.uniforms
  const material = useRef<THREE.ShaderMaterial>(null)
  const initialUniforms = useMemo(() => {
    const u: Record<string, THREE.IUniform> = {
      uTime: { value: 40 },
      uLightDir: { value: new THREE.Vector3(0, 0.2, -1) },
      uLightUp: { value: 1 },
    }
    for (const name of COLORS) u[`u${name}`] = { value: new THREE.Color() }
    return u
  }, [])

  useEffect(() => {
    if (!material.current) return
    const u = material.current.uniforms
    const s = daylight.sky
    const colors: Record<(typeof COLORS)[number], THREE.Color> = {
      SeaNear: s.seaNear,
      SeaFar: s.seaFar,
      Glitter: s.glitter,
      Haze: s.haze,
      SkyHorizon: s.horizon,
    }
    // the shader works in sRGB, while THREE.Color keeps linear values
    for (const name of COLORS) (u[`u${name}`].value as THREE.Color).copy(colors[name]).convertLinearToSRGB()
    // the sun or moon sits on the sky backdrop, 16 m out, measured from the horizon
    ;(u.uLightDir.value as THREE.Vector3).set(s.body.x, s.body.y, -16).normalize()
    u.uLightUp.value = THREE.MathUtils.smoothstep(s.body.y, -0.1, 0.4)
  }, [daylight])

  useFrame((_, delta) => {
    if (motion && material.current) material.current.uniforms.uTime.value += Math.min(delta, 0.1)
  })

  return (
    <mesh geometry={geometry} position-y={SEA.level}>
      <shaderMaterial ref={material} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={initialUniforms} side={THREE.DoubleSide} />
    </mesh>
  )
}

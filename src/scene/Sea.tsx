import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMotion } from '../lib/motion'
import type { Daylight } from './daylight'
import { SEA } from './layout'

// The sea outside the window: a real surface whose vertices are moved by layered Gerstner
// waves, so the water rises into crests and falls into troughs. The wave trains travel
// sideways and diagonally (never toward the viewer), and it is cel-shaded like the room:
// flat tones by how each face meets the sun or moon, foam on the crests, glints in the
// light's path, fading into haze at the horizon.

/** Rows get further apart with distance, so detail is spent where the eye can see it. */
function buildSurface() {
  const cols = 180
  const rows = 160
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

// xy: direction of travel (all have +x, so the sea flows left to right), z: steepness, w: wavelength in metres
const vec4 SWELL = vec4(1.0, -0.35, 0.2, 22.0);
const vec4 CROSS = vec4(1.0, 0.55, 0.18, 13.0);
const vec4 CHOP = vec4(0.8, -0.9, 0.16, 8.0);
const vec4 RIPPLE = vec4(1.0, 0.2, 0.14, 4.6);

vec3 gerstner(vec4 wave, vec2 p, float fade, inout vec3 tangent, inout vec3 binormal) {
  float k = 2.0 * PI / wave.w;
  float speed = sqrt(9.8 / k) * 0.42; // deep-water speed, slowed for a lazy afternoon
  vec2 d = normalize(wave.xy);
  float s = wave.z * fade;
  float f = k * (dot(d, p) - speed * uTime);
  float a = s / k;
  float sf = sin(f);
  float cf = cos(f);
  tangent += vec3(-d.x * d.x * s * sf, d.x * s * cf, -d.x * d.y * s * sf);
  binormal += vec3(-d.x * d.y * s * sf, d.y * s * cf, -d.y * d.y * s * sf);
  return vec3(d.x * a * cf, a * sf, d.y * a * cf);
}

void main() {
  vec3 world = (modelMatrix * vec4(position, 1.0)).xyz;
  float dist = length(world.xz - cameraPosition.xz);
  vec2 p = world.xz;
  vec3 tangent = vec3(1.0, 0.0, 0.0);
  vec3 binormal = vec3(0.0, 0.0, 1.0);
  // shorter waves fade out with distance, before the rows get too far apart to draw them
  vec3 offset = gerstner(SWELL, p, 1.0 - smoothstep(180.0, 380.0, dist), tangent, binormal);
  offset += gerstner(CROSS, p, 1.0 - smoothstep(110.0, 260.0, dist), tangent, binormal);
  offset += gerstner(CHOP, p, 1.0 - smoothstep(70.0, 160.0, dist), tangent, binormal);
  offset += gerstner(RIPPLE, p, 1.0 - smoothstep(35.0, 90.0, dist), tangent, binormal);
  world += offset;
  vHeight = offset.y;
  vNormal = normalize(cross(binormal, tangent));
  vWorld = world;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
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

  // cel shading: three flat tones by how far each wave face turns toward the light
  vec3 shadeDir = normalize(vec3(uLightDir.x, max(uLightDir.y, 0.2), uLightDir.z));
  float ndl = dot(N, shadeDir);
  float tone = ndl > 0.32 ? 1.18 : (ndl > 0.12 ? 0.94 : 0.7);
  vec3 col = mix(uSeaNear, uSeaFar, smoothstep(15.0, 260.0, dist) * 0.7) * tone;

  // faces seen edge-on reflect the bright sky near the horizon
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0);
  col = mix(col, uSkyHorizon, fresnel * 0.28);

  // foam on the crests, broken up and drifting with the water
  float breakup = noise(vWorld.xz * 0.9 + vec2(uTime * 0.5, 0.0));
  float foam = step(0.78 + 0.35 * breakup, vHeight) * step(0.35, fract(breakup * 5.0)) * (1.0 - smoothstep(50.0, 160.0, dist));
  col = mix(col, mix(uGlitter, vec3(1.0), 0.4), foam * 0.8);

  // hard-edged glints where a wave tilts the sun or moon straight at the eye
  vec3 R = reflect(-uLightDir, N);
  float facing = dot(R, V);
  float sparkle = noise(vWorld.xz * 2.2 + vec2(uTime * 1.4, uTime * 0.3));
  float glint = step(0.993 - 0.012 * sparkle, facing) * step(0.55, sparkle);
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

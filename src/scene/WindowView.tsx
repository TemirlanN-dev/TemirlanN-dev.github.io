import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useMotion } from '../lib/motion'

// The view out of the window: a summer sea painted by a shader on a big backdrop far
// outside, so it shifts with the camera like real distance. Anime-style cel-shaded clouds,
// hazy islands, glittering water and a little sailboat crossing the horizon.

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
  float n = fbm(vec2(q.x * 0.28 + uTime * 0.012, q.y * 0.5));
  float band = smoothstep(0.15, 0.7, q.y) * smoothstep(4.6, 1.2, q.y);
  return n * band;
}

const vec2 SUN = vec2(3.4, 3.0);

void main() {
  // metres on the backdrop; it is centred at eye level, so the horizon is y = 0
  vec2 q = (vUv - 0.5) * vec2(${WIDTH.toFixed(1)}, ${HEIGHT.toFixed(1)});
  vec3 col;

  if (q.y > 0.0) {
    // sky: pale near the horizon, deep summer blue overhead
    float h = q.y / 4.5;
    col = mix(vec3(0.80, 0.95, 1.0), vec3(0.22, 0.52, 1.0), smoothstep(0.0, 1.0, h));

    // sun glow
    float sd = length(q - SUN);
    col += vec3(1.0, 0.96, 0.85) * (0.55 * exp(-sd * 0.9) + 1.6 * smoothstep(0.42, 0.36, sd));

    // distant islands in blue haze
    float island = 0.42 * exp(-pow((q.x + 3.6) / 1.1, 2.0)) + 0.26 * exp(-pow((q.x + 2.3) / 0.7, 2.0)) + 0.18 * exp(-pow((q.x - 5.2) / 0.9, 2.0));
    if (q.y < island) col = mix(vec3(0.46, 0.64, 0.86), vec3(0.62, 0.78, 0.94), q.y / max(island, 0.01));

    // cel-shaded clouds: white where lit, a flat blue-grey shadow on the side away from the sun
    float d = cloudField(q);
    float body = smoothstep(0.43, 0.445, d);
    float towardSun = cloudField(q + normalize(SUN - q) * 0.22);
    float shade = smoothstep(0.47, 0.49, towardSun) * smoothstep(0.43, 0.5, d);
    vec3 cloud = mix(vec3(1.0), vec3(0.74, 0.83, 0.97), shade);
    cloud = mix(cloud, vec3(0.66, 0.77, 0.94), smoothstep(1.0, 0.25, q.y) * 0.6);
    col = mix(col, cloud, body);

    // a sailboat working its way along the horizon
    float bx = mod(uTime * 0.12, 16.0) - 8.0;
    vec2 b = q - vec2(bx, 0.0);
    float sail = step(0.0, b.y) * step(b.y, 0.32) * step(abs(b.x - 0.02), 0.12 * (1.0 - b.y / 0.32));
    float hull = step(abs(b.x), 0.16) * step(-0.05, b.y) * step(b.y, 0.02);
    col = mix(col, vec3(1.0), sail);
    col = mix(col, vec3(0.2, 0.25, 0.45), hull);
  } else {
    // sea: rows closer to the horizon are further away, so detail compresses toward it
    float depth = -q.y;
    float z = 1.0 / (depth + 0.06);
    vec2 w = vec2(q.x * z * 0.6, z * 1.2);
    col = mix(vec3(0.42, 0.72, 0.97), vec3(0.06, 0.3, 0.8), smoothstep(0.0, 2.2, depth));

    // swell lines rolling toward the shore
    float swell = sin(w.y * 2.4 + noise(w * 1.5) * 3.0 - uTime * 1.4);
    col = mix(col, col + vec3(0.12, 0.16, 0.2), smoothstep(0.86, 0.98, swell));

    // glitter, strongest in the sun's reflection
    float sunColumn = exp(-pow((q.x - SUN.x) * 0.55, 2.0));
    float glitter = noise(vec2(w.x * 7.0, w.y * 5.0 - uTime * 1.1));
    col += vec3(1.0, 0.98, 0.9) * smoothstep(0.86 - sunColumn * 0.2, 0.92 - sunColumn * 0.2, glitter) * (0.6 + sunColumn);

    // haze where sea meets sky
    col = mix(col, vec3(0.8, 0.93, 1.0), exp(-depth * 9.0) * 0.7);
  }

  // authored in sRGB; the renderer works in linear light
  gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
}
`

export default function WindowView() {
  const motion = useMotion()
  const uniforms = useMemo(() => ({ uTime: { value: 30 } }), [])

  useFrame((_, delta) => {
    if (motion) uniforms.uTime.value += Math.min(delta, 0.1)
  })

  return (
    <mesh position={[0, EYE_LEVEL, -1.2 - DISTANCE]}>
      <planeGeometry args={[WIDTH, HEIGHT]} />
      <shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} toneMapped={false} />
    </mesh>
  )
}

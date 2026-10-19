import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'

// The room follows the visitor's real clock: sunrise, day, sunset, dusk, a moonlit night, and
// from midnight to 1 a.m. the green Dark Hour. Keyframes below are blended smoothly between.
// `?time=19:30` in the URL pins a time, for previews.

type Rgb = string

type Keyframe = {
  at: number // hour of the day, 0–24
  // the view out of the window
  skyTop: Rgb
  skyHorizon: Rgb
  body: [x: number, y: number] // sun or moon, in metres on the backdrop (horizon at y = 0)
  bodyColor: Rgb
  bodySize: number
  moon: number // 0 = draw a sun, 1 = draw a moon
  stars: number
  cloudLit: Rgb
  cloudShade: Rgb
  seaNear: Rgb
  seaFar: Rgb
  glitter: Rgb
  haze: Rgb
  island: Rgb
  // the room
  light: Rgb
  lightIntensity: number
  hemiSky: Rgb
  hemiGround: Rgb
  hemiIntensity: number
  fill: Rgb
  fillIntensity: number
  lamp: number // the desk lamp turns itself on when this passes 0.5
  screenGlow: number
  dust: number
}

const DARK_HOUR: Omit<Keyframe, 'at'> = {
  skyTop: '#03120a',
  skyHorizon: '#1d4a2c',
  body: [2.7, 2.3],
  bodyColor: '#f4f0a0',
  bodySize: 0.85,
  moon: 1,
  stars: 0.5,
  cloudLit: '#3d6b4a',
  cloudShade: '#14261b',
  seaNear: '#06170e',
  seaFar: '#1d4630',
  glitter: '#e8f08a',
  haze: '#2b5a3a',
  island: '#10261a',
  light: '#b8e8a0',
  lightIntensity: 1.0,
  hemiSky: '#2d5a3a',
  hemiGround: '#0f1a14',
  hemiIntensity: 0.6,
  fill: '#6f9a7a',
  fillIntensity: 0.45,
  lamp: 1,
  screenGlow: 1.2,
  dust: 0.15,
}

const NIGHT: Omit<Keyframe, 'at'> = {
  skyTop: '#050b26',
  skyHorizon: '#1c2f6b',
  body: [3.0, 2.6],
  bodyColor: '#f2f5ff',
  bodySize: 0.42,
  moon: 1,
  stars: 1,
  cloudLit: '#4a5d96',
  cloudShade: '#1a2450',
  seaNear: '#050d2e',
  seaFar: '#1a2c64',
  glitter: '#dfe8ff',
  haze: '#23366e',
  island: '#121c44',
  light: '#a9c0ff',
  lightIntensity: 0.9,
  hemiSky: '#3b4f8f',
  hemiGround: '#1c1830',
  hemiIntensity: 0.6,
  fill: '#6f7fc0',
  fillIntensity: 0.45,
  lamp: 1,
  screenGlow: 1.2,
  dust: 0.1,
}

const DAY: Omit<Keyframe, 'at'> = {
  skyTop: '#3885ff',
  skyHorizon: '#ccf2ff',
  body: [3.4, 3.0],
  bodyColor: '#fff5d9',
  bodySize: 0.4,
  moon: 0,
  stars: 0,
  cloudLit: '#ffffff',
  cloudShade: '#bdd4f7',
  seaNear: '#0f4dcc',
  seaFar: '#6bb8f7',
  glitter: '#fffae6',
  haze: '#ccedff',
  island: '#75a3db',
  light: '#fff2dc',
  lightIntensity: 3.2,
  hemiSky: '#d6ecff',
  hemiGround: '#c99f70',
  hemiIntensity: 1.1,
  fill: '#fff0dc',
  fillIntensity: 1.4,
  lamp: 0,
  screenGlow: 0.35,
  dust: 0.7,
}

const KEYFRAMES: Keyframe[] = [
  { at: 0, ...DARK_HOUR },
  { at: 1, ...DARK_HOUR },
  { at: 1.4, ...NIGHT },
  { at: 4.8, ...NIGHT },
  {
    at: 6,
    ...DAY,
    skyTop: '#3d4f9e',
    skyHorizon: '#ffb38a',
    body: [-4.2, 0.35],
    bodyColor: '#ffd2a0',
    bodySize: 0.4,
    stars: 0.2,
    cloudLit: '#ffc6b0',
    cloudShade: '#8a7fb8',
    seaNear: '#2a3f8c',
    seaFar: '#e6a48f',
    glitter: '#ffe0c0',
    haze: '#f4b9a0',
    island: '#6a6aa0',
    light: '#ffc9a0',
    lightIntensity: 1.8,
    hemiSky: '#c9b8e8',
    hemiGround: '#8a6a70',
    hemiIntensity: 0.85,
    fill: '#ffd8c0',
    fillIntensity: 1.0,
    lamp: 0.6,
    screenGlow: 0.6,
    dust: 0.5,
  },
  { at: 8, ...DAY, skyTop: '#3a7be8', skyHorizon: '#cdeeff', body: [-2.0, 2.4], lightIntensity: 2.8, fillIntensity: 1.3, hemiIntensity: 1.05 },
  { at: 12.5, ...DAY, body: [0.6, 3.6] },
  { at: 16, ...DAY, light: '#fff0d8', lightIntensity: 3.1 },
  {
    at: 18,
    ...DAY,
    skyTop: '#4b4fa8',
    skyHorizon: '#ffb36b',
    body: [4.4, 0.55],
    bodyColor: '#ffb060',
    bodySize: 0.46,
    cloudLit: '#ffc48a',
    cloudShade: '#a67fb0',
    seaNear: '#2a3f99',
    seaFar: '#ff9e66',
    glitter: '#ffd08a',
    haze: '#ffc38f',
    island: '#7d6aa8',
    light: '#ffad6b',
    lightIntensity: 2.7,
    hemiSky: '#ffc89a',
    hemiGround: '#8a5a6a',
    hemiIntensity: 0.95,
    fill: '#ffd2b0',
    fillIntensity: 1.0,
    lamp: 1,
    screenGlow: 0.55,
    dust: 0.9,
  },
  {
    at: 19.3,
    ...NIGHT,
    skyTop: '#1c2463',
    skyHorizon: '#c76f8e',
    body: [4.6, -0.3],
    bodyColor: '#ff8a6a',
    bodySize: 0.4,
    moon: 0,
    stars: 0.5,
    cloudLit: '#b06f90',
    cloudShade: '#3a3570',
    seaNear: '#0e1a55',
    seaFar: '#a35a7a',
    glitter: '#ffb0a0',
    haze: '#b0688c',
    island: '#3e3a72',
    light: '#c99ad0',
    lightIntensity: 1.0,
    hemiSky: '#7a6fae',
    hemiGround: '#3a2a48',
    hemiIntensity: 0.7,
    fill: '#9a8ac8',
    fillIntensity: 0.6,
    screenGlow: 1.0,
    dust: 0.3,
  },
  { at: 20.6, ...NIGHT },
  { at: 23.75, ...NIGHT },
  { at: 24, ...DARK_HOUR },
]

export type Daylight = {
  hour: number
  sky: {
    top: THREE.Color
    horizon: THREE.Color
    body: THREE.Vector2
    bodyColor: THREE.Color
    bodySize: number
    moon: number
    stars: number
    cloudLit: THREE.Color
    cloudShade: THREE.Color
    seaNear: THREE.Color
    seaFar: THREE.Color
    glitter: THREE.Color
    haze: THREE.Color
    island: THREE.Color
  }
  light: { color: THREE.Color; intensity: number; position: THREE.Vector3 }
  hemi: { sky: THREE.Color; ground: THREE.Color; intensity: number }
  fill: { color: THREE.Color; intensity: number }
  lampOn: boolean
  screenGlow: number
  dust: number
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t
const mixColor = (a: Rgb, b: Rgb, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), t)

export function daylightAt(hour: number): Daylight {
  const h = ((hour % 24) + 24) % 24
  const i = KEYFRAMES.findIndex((k) => k.at > h)
  const a = KEYFRAMES[i - 1]
  const b = KEYFRAMES[i]
  const t = (h - a.at) / (b.at - a.at)
  const n = (key: 'bodySize' | 'moon' | 'stars' | 'lightIntensity' | 'hemiIntensity' | 'fillIntensity' | 'lamp' | 'screenGlow' | 'dust') => mix(a[key], b[key], t)
  const c = (key: Exclude<keyof Keyframe, 'at' | 'body' | 'bodySize' | 'moon' | 'stars' | 'lightIntensity' | 'hemiIntensity' | 'fillIntensity' | 'lamp' | 'screenGlow' | 'dust'>) =>
    mixColor(a[key], b[key], t)

  const body = new THREE.Vector2(mix(a.body[0], b.body[0], t), mix(a.body[1], b.body[1], t))
  return {
    hour: h,
    sky: {
      top: c('skyTop'),
      horizon: c('skyHorizon'),
      body,
      bodyColor: c('bodyColor'),
      bodySize: n('bodySize'),
      moon: n('moon'),
      stars: n('stars'),
      cloudLit: c('cloudLit'),
      cloudShade: c('cloudShade'),
      seaNear: c('seaNear'),
      seaFar: c('seaFar'),
      glitter: c('glitter'),
      haze: c('haze'),
      island: c('island'),
    },
    // the sun or moon shines in from where it sits in the sky; never from below the horizon
    light: { color: c('light'), intensity: n('lightIntensity'), position: new THREE.Vector3(body.x * 1.6, 1 + Math.max(body.y, 0.3) * 2, -6.5) },
    hemi: { sky: c('hemiSky'), ground: c('hemiGround'), intensity: n('hemiIntensity') },
    fill: { color: c('fill'), intensity: n('fillIntensity') },
    lampOn: n('lamp') > 0.5,
    screenGlow: n('screenGlow'),
    dust: n('dust'),
  }
}

/** `?time=19:30` (or `?time=19.5`) pins the hour; otherwise the local clock. */
function currentHour() {
  const pinned = new URLSearchParams(location.search).get('time')
  if (pinned) {
    const [hh, mm = '0'] = pinned.split(':')
    const hour = Number(hh) + Number(mm) / 60
    if (Number.isFinite(hour)) return hour
  }
  const now = new Date()
  return now.getHours() + now.getMinutes() / 60
}

/** The current daylight, refreshed every minute. */
export function useDaylight() {
  const [hour, setHour] = useState(currentHour)
  useEffect(() => {
    const id = setInterval(() => setHour(currentHour()), 60_000)
    return () => clearInterval(id)
  }, [])
  return useMemo(() => daylightAt(hour), [hour])
}

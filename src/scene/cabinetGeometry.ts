import * as THREE from 'three'

// The cabinet is built from its side silhouette: each edge of this outline becomes a panel
// (kick plate, control panel, screen bezel, marquee, ...) spanning the cabinet's width.

type ZY = readonly [z: number, y: number]

// Side profile in metres: z points out of the cabinet toward the player, y is up.
export const PROFILE: ZY[] = [
  [-0.42, 0], // back, floor
  [0.32, 0], // front, floor
  [0.32, 0.86], // under the control panel
  [0.5, 0.96], // control panel front, bottom
  [0.5, 1.02], // control panel front, top
  [0.16, 1.12], // control panel back = screen bottom
  [0.06, 1.58], // screen top
  [0.26, 1.67], // marquee bottom
  [0.26, 1.9], // marquee top
  [-0.42, 1.9], // back, top
]

export const CABINET_WIDTH = 0.8
export const SIDE_THICKNESS = 0.035
export const PANEL_THICKNESS = 0.02
export const SCREEN_W = 0.62
export const SCREEN_H = 0.4

export type Edge = {
  len: number
  /** rotation about x that turns a panel's +y along the edge and its +z outward */
  rx: number
  /** midpoint of the edge on the cabinet's outer surface */
  mid: THREE.Vector3
  normal: THREE.Vector3
}

function edge(a: ZY, b: ZY): Edge {
  const dz = b[0] - a[0]
  const dy = b[1] - a[1]
  const rx = Math.atan2(dz, dy)
  return {
    len: Math.hypot(dz, dy),
    rx,
    mid: new THREE.Vector3(0, (a[1] + b[1]) / 2, (a[0] + b[0]) / 2),
    normal: new THREE.Vector3(0, -Math.sin(rx), Math.cos(rx)),
  }
}

// Every edge except the floor one, starting at the front-bottom corner.
export const EDGES = PROFILE.slice(1).map((a, i) => edge(a, PROFILE[(i + 2) % PROFILE.length]))
export const EDGE = { kick: 0, controls: 3, bezel: 4, marquee: 6 } as const

export const SCREEN_OFFSET = 0.003
export const SCREEN_NORMAL = EDGES[EDGE.bezel].normal.clone()
/** Centre of the screen on a cabinet standing at the origin. */
export const SCREEN_CENTER = EDGES[EDGE.bezel].mid.clone().addScaledVector(SCREEN_NORMAL, SCREEN_OFFSET)

export const SIDE_GEOMETRY = new THREE.ExtrudeGeometry(new THREE.Shape(PROFILE.map(([z, y]) => new THREE.Vector2(z, y))), {
  depth: SIDE_THICKNESS,
  bevelEnabled: false,
})

/** Front and top outline of a side panel, for the glowing trim. */
export function trimPoints(x: number): [number, number, number][] {
  return PROFILE.slice(1).map(([z, y]) => [x, y, z])
}

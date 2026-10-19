import * as THREE from 'three'

// Where things are in the room, in metres. The back wall (with the window) is at z = -1.2,
// the floor at y = 0, and the camera looks at the desk from the open front of the room.

export const ROOM = { halfWidth: 2.3, back: -1.2, front: 3.6, height: 2.9 }
export const WINDOW = { left: -1.35, right: 1.35, bottom: 0.95, top: 2.35, transom: 2.0 }
export const DESK_TOP = 0.76

/** The sea outside: a wavy surface below the house, running from just past it to the horizon. */
export const SEA = { level: -0.6, near: -5, far: -420 }

// The monitor faces the camera; the menu lives "inside" its screen.
export const MONITOR = { x: 0, y: 1.12, z: -0.97, width: 0.66, height: 0.4, depth: 0.035 }
export const SCREEN_W = 0.6
export const SCREEN_H = 0.3375
export const SCREEN_NORMAL = new THREE.Vector3(0, 0, 1)
export const SCREEN_CENTER = new THREE.Vector3(MONITOR.x, MONITOR.y, MONITOR.z + MONITOR.depth / 2 + 0.002)

/** What the resting camera looks at, and the direction back from there to the camera. */
export const REST_TARGET = new THREE.Vector3(-0.05, 1.12, -0.9)
export const REST_DIRECTION = new THREE.Vector3(0.3, 0.38, 3.2).normalize()
export const REST_DISTANCE = 3.24

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import type { ThreeElements, ThreeEvent } from '@react-three/fiber'
import { Outlines } from '@react-three/drei'

// The room's anime look: three-step toon shading plus ink outlines on every part.

/** Three flat light levels: shadow, mid, lit. */
export const TOON_RAMP = (() => {
  const texture = new THREE.DataTexture(new Uint8Array([95, 175, 255]), 3, 1, THREE.RedFormat)
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
})()

export const INK = '#231b35'
const INK_HOVER = '#38c8ff'

/** Outline colour for everything below; clickable things switch it while hovered. */
const InkContext = createContext(INK)

/** Ink outline, a constant ~2px on screen whatever the distance. */
export function Ink({ width = 2.2 }: { width?: number }) {
  return <Outlines thickness={width} color={useContext(InkContext)} />
}

export function Toon({ color, map, ...rest }: { color: THREE.ColorRepresentation; map?: THREE.Texture | null } & Omit<ThreeElements['meshToonMaterial'], 'color' | 'map'>) {
  return <meshToonMaterial color={color} map={map ?? null} gradientMap={TOON_RAMP} {...rest} />
}

type PartProps = Omit<ThreeElements['mesh'], 'children'> & {
  color: THREE.ColorRepresentation
  /** geometry element, e.g. <boxGeometry args={[1, 1, 1]} /> */
  shape: ReactNode
  ink?: boolean
  map?: THREE.Texture | null
}

/** A shaded, outlined mesh that casts and receives shadows. */
export function Part({ color, shape, ink = true, map, ...mesh }: PartProps) {
  return (
    <mesh castShadow receiveShadow {...mesh}>
      {shape}
      <Toon color={color} map={map} />
      {ink && <Ink />}
    </mesh>
  )
}

/** Box with its size and centre given directly, the most common part. */
export function Block({ size, ...rest }: Omit<PartProps, 'shape'> & { size: [number, number, number] }) {
  return <Part shape={<boxGeometry args={size} />} {...rest} />
}

/** Cylinder between two points, for lamp arms, rods and strings. */
export function Rod({ from, to, radius, color, ink = true }: { from: THREE.Vector3Tuple; to: THREE.Vector3Tuple; radius: number; color: THREE.ColorRepresentation; ink?: boolean }) {
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const dir = b.clone().sub(a)
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
  return (
    <Part
      position={a.add(b).multiplyScalar(0.5).toArray()}
      quaternion={quaternion}
      color={color}
      ink={ink}
      shape={<cylinderGeometry args={[radius, radius, dir.length(), 10]} />}
    />
  )
}

type ClickableProps = {
  enabled: boolean
  onClick: () => void
  onHover?: (hovered: boolean) => void
  children: ReactNode
} & Omit<ThreeElements['group'], 'onClick' | 'children'>

/** A group you can click: pointer cursor and cyan outlines while hovered. */
export function Clickable({ enabled, onClick, onHover, children, ...group }: ClickableProps) {
  const [hovered, setHovered] = useState(false)
  const set = (next: boolean) => {
    setHovered(next)
    onHover?.(next)
    document.body.style.cursor = next ? 'pointer' : ''
  }
  const lit = hovered && enabled

  // the room stops being clickable while the camera moves; drop any hover state then
  useEffect(() => {
    if (enabled || !hovered) return
    setHovered(false)
    onHover?.(false)
    document.body.style.cursor = ''
  }, [enabled, hovered, onHover])

  return (
    <group
      {...group}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        if (!enabled) return
        e.stopPropagation()
        set(true)
      }}
      onPointerOut={() => hovered && set(false)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!enabled) return
        e.stopPropagation()
        onClick()
      }}
    >
      <InkContext.Provider value={lit ? INK_HOVER : INK}>{children}</InkContext.Provider>
    </group>
  )
}

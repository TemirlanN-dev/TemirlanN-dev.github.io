export const hasWebGL = (() => {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return gl !== null
  } catch {
    return false
  }
})()

const matches = (query: string) => typeof matchMedia === 'function' && matchMedia(query).matches

export const isCoarsePointer = () => matches('(pointer: coarse)')
export const isLowPower = () => isCoarsePointer() || (navigator.hardwareConcurrency ?? 8) <= 4

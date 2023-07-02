import type { MarginObject } from './types'

export function resolveMargin(margin: number | MarginObject) {
  return typeof margin === 'number'
    ? {
        top: margin,
        right: margin,
        bottom: margin,
        left: margin,
      }
    : margin
}

export function getAspectRatio(width: number, height: number) {
  const gcd = (a: number, b: number): number => {
    if (!b)
      return a
    return gcd(b, a % b)
  }
  const ratio = gcd(width, height)
  if (ratio > 3)
    return `${width / ratio}:${height / ratio}`
  return `${width}:${height}`
}

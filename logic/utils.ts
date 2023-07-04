import { dataUrlGeneratedQRCode, qrcode } from './state'
import type { MarginObject, State } from './types'

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

export function sendQRCodeToCompare(state: State) {
  if (!dataUrlGeneratedQRCode.value || !qrcode.value)
    return
  state.uploaded.qrcode = dataUrlGeneratedQRCode.value
  const margin = resolveMargin(state.qrcode.margin)
  state.compare.gridSize = qrcode.value.size + margin.left + margin.right
  state.compare.gridMarginSize = Math.min(margin.left, margin.right, margin.top, margin.bottom)
}

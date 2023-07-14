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

export function colorHexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!result)
    return null
  return [
    Number.parseInt(result[1], 16),
    Number.parseInt(result[2], 16),
    Number.parseInt(result[3], 16),
  ]
}

export function colorRgbToHex(rgb: number[]) {
  return `#${rgb.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`
}

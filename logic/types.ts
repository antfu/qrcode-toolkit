import type QrScanner from 'qr-scanner'

export const PixelStyles = [
  'square',
  'rounded',
  'dot',
  'squircle',
  'row',
  'column',
] as const

// @unocss-include
export const PixelStyleIcons = [
  'i-custom-pixel-square',
  'i-custom-pixel-rounded',
  'i-custom-pixel-dot',
  'i-custom-pixel-squircle',
  'i-custom-pixel-row',
  'i-custom-pixel-column',
]

export const MarkerShapes = [
  'square',
  'circle',
  'plus',
  'box',
  'octagon',
  'random',
] as const

export const MarkerShapeIcons = [
  'i-custom-marker-square',
  'i-custom-marker-circle',
  'i-custom-marker-plus',
  'i-custom-marker-box',
  'i-custom-marker-octagon',
  'i-custom-marker-random',
]

export type PixelStyle = typeof PixelStyles[number]
export type MarkerShape = typeof MarkerShapes[number]

export interface GeneratedQRInfo {
  width: number
  height: number
}

export interface MarginObject {
  top: number
  right: number
  bottom: number
  left: number
}

export interface QRCodeGeneratorState {
  text: string
  ecc: 'L' | 'M' | 'Q' | 'H'
  margin: number | MarginObject
  scale: number
  seed: number
  lightColor: string
  darkColor: string
  maskPattern: number
  boostECC: boolean
  minVersion: number
  maxVersion: number
  pixelStyle: PixelStyle
  markerStyle: PixelStyle | 'auto'
  markerShape: MarkerShape
  marginNoise: boolean
  marginNoiseRate: number
  marginNoiseSpace: 'none' | 'marker' | 'full'
  invert: boolean
  rotate: 0 | 90 | 180 | 270

  effect: 'none' | 'crystalize'
  effectCrystalizeRadius: number
}

export interface ComparionState {
  grayscale: boolean
  contrast: number
  blur: number
  grid: boolean
  gridSize: number
  gridMarginSize: number | MarginObject
  gridOpacity: number
  gridColor: string
  overlay: boolean
  overlayBlendMode: string
  overlayOpacity: number
  pixelView: boolean
  diffThreshold: number

  downloadType: 'correction' | 'mask'
  downloadShowImage: boolean
  maskColor: string
  maskShape: 'square' | 'circle'
  correctionShape: 'square' | 'circle'
  correctionOpacity: number
  correctionBlur: number
  correctionBlendMode: GlobalCompositeOperation | 'none'
}

export interface UploadState {
  image?: string
  qrcode?: string
  qrcodeWidth?: number
  qrcodeHeight?: number
}

export interface State {
  qrcode: QRCodeGeneratorState
  compare: ComparionState
  uploaded: UploadState
}

export interface Segment {
  x: number
  y: number
  index: number
  data: ImageData
  hex: string
  color: [number, number, number, number]
  luminance: number
  value: number
  expected: number
  isMargin: boolean
}

export interface Diff {
  segments: Segment[]
  mainSegments: Segment[]
  mismatchDark: Segment[]
  mismatchLight: Segment[]
  mismatchCount: number
  avarageLuminance: number
  lightLuminance: number
  darkLuminance: number
}

export interface ScanResult {
  result: QrScanner.ScanResult | null
  error: Error | null
}

import type QrScanner from 'qr-scanner'

export type PixelStyle = 'square' | 'dot' | 'squircle' | 'mixed' | 'rounded'

export interface QRCodeGeneratorState {
  text: string
  ecc: 'L' | 'M' | 'Q' | 'H'
  margin: number
  scale: number
  seed: number
  lightColor: string
  darkColor: string
  maskPattern: number
  boostECC: boolean
  minVersion: number
  maxVersion: number
  pixelStyle: PixelStyle
  markerStyle: 'auto' | PixelStyle
  markerShape: 'square' | 'circle' | 'plus' | 'box' | 'random'
  marginNoise: boolean
  marginNoiseRate: number
  marginNoiseSpace: 'none' | 'marker' | 'full'
  invert: boolean
  rotate: 0 | 90 | 180 | 270
}

export interface ComparionState {
  grayscale: boolean
  contrast: number
  blur: number
  grid: boolean
  gridSize: number
  gridMarginSize: number
  gridOpacity: number
  gridColor: string
  overlay: boolean
  overlayBlendMode: string
  overlayOpacity: number
  pixelView: boolean
  diffThreshold: number

  downloadShowImage: boolean
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

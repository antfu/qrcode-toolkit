export interface QRCodeGeneratorState {
  text: string
  ecc: 'L' | 'M' | 'Q' | 'H'
  border: number
  scale: number
  lightColor: string
  darkColor: string
  maskPattern: number
  boostECC: boolean
  minVersion: number
  maxVersion: number
  borderNoise: boolean
  borderNoiseRate: number
  borderNoiseSeed: number
  rotate: 0 | 90 | 180 | 270
}

export interface ComparionState {
  grayscale: boolean
  contrast: number
  blur: number
  grid: boolean
  gridSize: number
  gridOpacity: number
  gridColor: string
  overlay: boolean
  overlayBlendMode: string
  overlayOpacity: number
}

export interface State {
  qrcode: QRCodeGeneratorState
  compare: ComparionState
}

export function defaultGeneratorState(): QRCodeGeneratorState {
  return {
    text: '',
    ecc: 'M',
    border: 2,
    scale: 16,
    lightColor: '#ffffff',
    darkColor: '#000000',
    maskPattern: -1,
    minVersion: 1,
    maxVersion: 40,
    boostECC: false,
    rotate: 0,
    borderNoise: false,
    borderNoiseRate: 0.5,
    borderNoiseSeed: Math.round(Math.random() * 1000000),
  }
}

export function defaultCompareState(): ComparionState {
  return {
    grayscale: false,
    contrast: 100,
    blur: 0,
    grid: true,
    gridSize: -1,
    gridOpacity: 0.5,
    gridColor: '#888888',
    overlay: false,
    overlayBlendMode: 'normal',
    overlayOpacity: 0.5,
  }
}

export function defaultState(): State {
  return {
    qrcode: defaultGeneratorState(),
    compare: defaultCompareState(),
  }
}

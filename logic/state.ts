import type { QrCode } from '../vendor/qrcodegen'
import type { ComparionState, QRCodeGeneratorState, State } from './types'

export const storeIndex = useLocalStorage('qrd-state-index', 1, { listenToStorageChanges: false })
export const showGridHelper = ref<boolean>(false)
export const showDownloadDialog = ref<boolean>(false)

export const qrcode = shallowRef<QrCode>()
export const dataUrlGeneratedQRCode = ref<string>()
export const dataUrlGeneratedSize = ref<number>(25)

export function defaultGeneratorState(): QRCodeGeneratorState {
  return {
    text: '',
    ecc: 'M',
    margin: 2,
    scale: 20,
    lightColor: '#ffffff',
    darkColor: '#000000',
    pixelStyle: 'rounded',
    markerStyle: 'auto',
    markerShape: 'square',
    maskPattern: -1,
    minVersion: 1,
    maxVersion: 40,
    boostECC: false,
    rotate: 0,
    invert: false,
    marginNoise: false,
    marginNoiseRate: 0.5,
    seed: Math.round(Math.random() * 1000000),
    marginNoiseSpace: 'marker',
  }
}

export function defaultCompareState(): ComparionState {
  return {
    grayscale: false,
    contrast: 100,
    blur: 0,
    grid: true,
    gridSize: 23,
    gridMarginSize: 1,
    gridOpacity: 0.5,
    gridColor: '#888888',
    overlay: false,
    pixelView: false,
    overlayBlendMode: 'normal',
    overlayOpacity: 0.5,
    diffThreshold: 3,

    downloadShowImage: false,
    correctionOpacity: 1,
    correctionBlur: 2,
    correctionBlendMode: 'none',
  }
}

export function defaultState(): State {
  return {
    qrcode: defaultGeneratorState(),
    compare: defaultCompareState(),
    uploaded: {
      image: undefined,
      qrcode: undefined,
      qrcodeWidth: undefined,
      qrcodeHeight: undefined,
    },
  }
}

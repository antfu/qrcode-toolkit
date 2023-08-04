import { breakpointsTailwind } from '@vueuse/core'
import type { QrCodeGenerateResult } from 'uqr'
import type { ComparionState, GeneratedQRInfo, QRCodeGeneratorState, ScannerState, State } from './types'

export const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
export const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

export const storeIndex = useLocalStorage('qrd-state-index', 1, { listenToStorageChanges: false })
export const showGridHelper = ref<boolean>(false)
export const showDownloadDialog = ref<boolean>(false)
export const hasParentWindow = ref<boolean>(false)

export const qrcode = shallowRef<QrCodeGenerateResult>()
export const dataUrlGeneratedQRCode = ref<string>()
export const dataUrlScannerUpload = ref<string>()
export const dataUrlGeneratedSize = ref<number>(25)
export const generateQRCodeInfo = ref<GeneratedQRInfo>()

export const isDark = useDark()
export const isLargeScreen = useBreakpoints(breakpointsTailwind).greater('lg')

export const toggleDark = useToggle(isDark)

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
    markerInnerShape: 'auto',
    markerSub: 'square',
    markers: [],
    maskPattern: -1,
    minVersion: 1,
    maxVersion: 40,
    boostECC: false,
    rotate: 0,
    invert: false,
    marginNoise: false,
    marginNoiseRate: 0.5,
    marginNoiseOpacity: 1,
    seed: Math.round(Math.random() * 1000000),
    marginNoiseSpace: 'marker',
    renderPointsType: 'all',

    effect: 'none',
    effectTiming: 'after',
    effectCrystalizeRadius: 8,
    effectLiquidifyDistortRadius: 8,
    effectLiquidifyRadius: 8,
    effectLiquidifyThreshold: 128,

    transformPerspectiveX: 0,
    transformPerspectiveY: 0,
    transformScale: 1,
  }
}

export function defaultCompareState(): ComparionState {
  return {
    grayscale: false,
    contrast: 100,
    brightness: 100,
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
    downloadType: 'correction',
    maskColor: '#000000',
    maskShape: 'square',
    correctionShape: 'square',
    correctionOpacity: 1,
    correctionBlur: 2,
    correctionBlendMode: 'none',
  }
}

export function defaultScannerState(): ScannerState {
  return {
    grayscale: true,
    contrast: 500,
    brightness: 200,
    blur: 0.2,
    resize: 300,
    locks: ['grayscale'],
    cameraMirror: false,
    cameraViewMode: 'processed',
    cameraSampleDelay: 100,
  }
}

export function defaultState(): State {
  return {
    qrcode: defaultGeneratorState(),
    compare: defaultCompareState(),
    scanner: defaultScannerState(),
    uploaded: {
      image: undefined,
      qrcode: undefined,
      qrcodeWidth: undefined,
      qrcodeHeight: undefined,
    },
  }
}

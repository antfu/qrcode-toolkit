import { deepMerge } from '@antfu/utils'
import { defaultState } from './state'
import type { State } from './state'

export const state = useLocalStorage<State>(
  'qrd-state',
  defaultState(),
  {
    mergeDefaults(storageValue, defaults) {
      return deepMerge({}, defaults, storageValue)
    },
  },
)

export const dataUrlUploadedImage = useLocalStorage('qrd-upload-image', '')
export const dataUrlUploadedQRCode = useLocalStorage('qrd-upload-qrcode', '')

export const dataUrlGeneratedQRCode = ref<string>()
export const dataUrlGeneratedSize = ref<number>(25)

export const dataUrlQRCode = computed(() => dataUrlUploadedQRCode.value || dataUrlGeneratedQRCode.value)

<script setup lang="ts">
import { deepMerge } from '@antfu/utils'
import { defaultState, storeIndex } from '~/logic/state'
import type { State } from '~/logic/types'

defineProps<{
  index: number
  view: 'generator' | 'compare'
}>()

const uploadTarget = ref<'image' | 'qrcode'>()

const state = useLocalStorage<State>(
  `qrd-state-${storeIndex.value}`,
  defaultState(),
  {
    mergeDefaults(storageValue, defaults) {
      return deepMerge({}, defaults, storageValue)
    },
  },
)

const { isOverDropZone } = useDropZone(document.body, {
  onDrop(files) {
    if (!files || !uploadTarget.value)
      return

    const file = files[0]
    if (file.type === 'image/png' || file.type === 'image/jpeg') {
      const reader = new FileReader()
      reader.onload = () => {
        const data = reader.result as string
        if (uploadTarget.value === 'image')
          state.value.uploaded.image = data
        else if (uploadTarget.value === 'qrcode')
          state.value.uploaded.qrcode = data
      }
      reader.readAsDataURL(file)
    }
  },
  onLeave() {
    uploadTarget.value = undefined
  },
  onOver(_, event) {
    if (!isOverDropZone.value)
      return

    const chain = Array.from(document.elementsFromPoint(event.clientX, event.clientY))
    if (chain.find(el => el.id === 'upload-zone-image'))
      uploadTarget.value = 'image'
    else if (chain.find(el => el.id === 'upload-zone-qrcode'))
      uploadTarget.value = 'qrcode'
    else
      uploadTarget.value = undefined
  },
})
</script>

<template>
  <div v-show="view === 'generator'" w-full>
    <Generator :state="state" />
  </div>
  <div v-show="view === 'compare'" w-full>
    <Compare :state="state" />
  </div>
  <div v-if="isOverDropZone" grid="~ cols-2" fixed bottom-0 left-0 right-0 top-0 z-200 bg-black:20 backdrop-blur-10>
    <div
      id="upload-zone-image" flex="~ col gap-3 items-center justify-center" m10 mr-1 op40
      :class="uploadTarget === 'image' ? 'bg-gray:20 op100 border-base' : ''"
      border="3 dashed transparent rounded-xl"
    >
      <div i-carbon-image text-20 />
      <div text-xl>
        Upload as target image
      </div>
    </div>
    <div
      id="upload-zone-qrcode" flex="~ col gap-3 items-center justify-center" m10 ml-1 op40
      :class="uploadTarget === 'qrcode' ? 'bg-gray:20 op100 border-base' : ''"
      border="3 dashed transparent rounded-xl"
    >
      <div i-carbon-qr-code text-20 />
      <div text-xl>
        Upload as QR Code reference
      </div>
    </div>
  </div>
</template>

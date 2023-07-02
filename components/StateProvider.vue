<script setup lang="ts">
import { deepMerge } from '@antfu/utils'
import { defaultState, hasParentWindow, showGridHelper, storeIndex, view } from '~/logic/state'
import type { State } from '~/logic/types'

defineProps<{
  index: number
}>()

const uploadTarget = ref<'image' | 'qrcode'>()

const state = useLocalStorage<State>(
  `qrd-state-${storeIndex.value}`,
  defaultState(),
  {
    mergeDefaults(storageValue, defaults) {
      const result = deepMerge({}, defaults, storageValue)
      return result
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
        if (uploadTarget.value === 'image') {
          state.value.uploaded.image = data
        }
        else if (uploadTarget.value === 'qrcode') {
          state.value.uploaded.qrcode = data
          showGridHelper.value = true
        }
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

// API for iframe communication
useEventListener(window, 'message', (event) => {
  const { data } = event
  if (typeof data !== 'string')
    return
  try {
    const json = JSON.parse(data)
    // eslint-disable-next-line no-console
    console.log('Message from parent window', json)
    if (json.source !== 'qrtoolkit-parent')
      return
    switch (json.event) {
      case 'setImage':
        state.value.uploaded.image = json.data
        view.value = 'compare'
        break
      case 'init':
        hasParentWindow.value = true
        break
    }
  }
  catch (e) {
    console.error('Failed to parse message from parent window', e)
  }
})
</script>

<template>
  <div flex="~ gap-2">
    <button
      flex="~ gap-1.5 items-center" text-button
      :class="view === 'generator' ? 'bg-secondary' : 'op50'"
      @click="view = 'generator'"
    >
      <div i-ri-qr-code-line />
      Generator
    </button>
    <button
      flex="~ gap-1.5 items-center" text-button
      :class="view === 'compare' ? 'bg-secondary' : 'op50'"
      @click="view = 'compare'"
    >
      <div i-ri-compasses-2-line />
      Compare
    </button>
    <div flex-auto />
  </div>

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

  <DialogGridAlign
    v-if="showGridHelper"
    v-model="showGridHelper"
    :state="state"
  />
</template>

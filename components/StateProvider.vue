<script setup lang="ts">
import { deepMerge } from '@antfu/utils'
import { sendParentEvent } from '~/logic/messaging'
import { dataUrlScannerUpload, defaultState, hasParentWindow, isLargeScreen, showGridHelper, storeIndex } from '~/logic/state'
import { view } from '~/logic/view'
import type { State } from '~/logic/types'

defineProps<{
  index: number
}>()

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
        hasParentWindow.value = true
        state.value.uploaded.image = json.data
        view.value = 'compare'
        break
      case 'setScannerImage':
        hasParentWindow.value = true
        dataUrlScannerUpload.value = json.data
        view.value = 'verify'
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

// eslint-disable-next-line no-console
console.log('State', state.value)

onMounted(() => {
  // send message to parent window to let it know we're ready
  sendParentEvent('init', {})
})
</script>

<template>
  <div flex="~ gap-2 items-center wrap">
    <button
      flex="~ gap-1.5  items-center" text-button
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
    <button
      flex="~ gap-1.5 items-center" text-button
      :class="view === 'verify' ? 'bg-secondary' : 'op50'"
      @click="view = 'verify'"
    >
      <div i-ri-qr-scan-2-line />
      Verify
    </button>
    <button
      flex="~ gap-1.5 items-center" text-button
      :class="view === 'camera' ? 'bg-secondary' : 'op50'"
      @click="view = 'camera'"
    >
      <div i-ri-camera-line />
      Camera
    </button>
    <div flex-auto />
    <div>
      <a href="https://antfu.me" target="_blank" op75 hover:underline hover:op100>Anthony Fu</a><span op50>'s QR Toolkit</span>
    </div>
    <button
      flex="~ gap-1.5 items-center" ml2 text-sm text-button
      :class="view === 'credit' ? 'bg-secondary' : 'op50'"
      @click="view = 'credit'"
    >
      Credits
    </button>
  </div>

  <div v-show="view === 'generator'" w-full>
    <Generator :state="state" />
  </div>
  <div v-show="view === 'compare'" w-full>
    <div v-if="!isLargeScreen" flex px20 py50 text-center op50>
      This app is not supported on mobile devices. Please try with a bigger screen.
    </div>
    <Compare v-else :state="state" />
  </div>
  <div v-if="view === 'verify'" w-full>
    <Scanner :state="state" />
  </div>
  <div v-if="view === 'camera'" w-full>
    <Camera :state="state" />
  </div>
  <div v-if="view === 'credit'" w-full>
    <Credits />
  </div>

  <DialogGridAlign
    v-if="showGridHelper"
    v-model="showGridHelper"
    :state="state"
  />
</template>

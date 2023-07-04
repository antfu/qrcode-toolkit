<script setup lang="ts">
import { deepMerge } from '@antfu/utils'
import { defaultState, hasParentWindow, showGridHelper, storeIndex, view } from '~/logic/state'
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
    <button
      flex="~ gap-1.5 items-center" text-button
      :class="view === 'credit' ? 'bg-secondary' : 'op50'"
      @click="view = 'credit'"
    >
      <div i-ri-user-heart-line />
      Credits
    </button>
  </div>

  <div v-show="view === 'generator'" w-full>
    <Generator :state="state" />
  </div>
  <div v-show="view === 'compare'" w-full>
    <Compare :state="state" />
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

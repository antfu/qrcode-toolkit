<script setup lang="ts">
import type { State } from '~/logic/types'

const props = defineProps<{
  modelValue: boolean
  state: State
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const gridSize = ref(props.state.compare.gridSize)
const gridMarginSize = ref(props.state.compare.gridMarginSize)

function close() {
  emit('update:modelValue', false)
}

function cancel() {
  close()
}

function apply() {
  props.state.compare.gridSize = gridSize.value
  props.state.compare.gridMarginSize = gridMarginSize.value
  cancel()
}
</script>

<template>
  <dialog
    :open="modelValue"
    class="fixed inset-0 z-50000"
    @close="cancel()"
  >
    <div
      class="fixed inset-0 bg-black/20 backdrop-blur-10"
      @click="apply()"
    />
    <div class="relative z-10 max-w-full w-[35rem] rounded-lg p-4 bg-base" flex="~ col gap-4" border="~ base">
      <h1 text-xl>
        Align Grid
      </h1>
      <div border="~ base rounded-lg" relative aspect-ratio-1 of-hidden>
        <img
          :src="state.uploaded.qrcode"
          absolute inset-0 h-full w-full object-cover op65
        >

        <GridLines
          v-bind="{
            gridSize,
            gridColor: 'red',
            gridOpacity: 0.8,
            gridMarginSize,
            gridMarginColor: 'lime',
            darkenMargin: true,
          }"
        />
      </div>

      <p>
        Slide the Grid slider to make the red grid lines align with all the pixel.
        Slide the Margin slider to make the green box align with the QR Code body.
      </p>

      <div flex="~ col gap-2">
        <OptionItem title="Grid">
          <OptionSlider v-model="gridSize" :min="0" :max="50" :step="1" />
        </OptionItem>

        <SettingsMargin v-model="gridMarginSize" />
      </div>

      <div flex="~ gap-2 justify-end" mt-5>
        <button px5 op75 text-button @click="cancel()">
          Cancel
        </button>
        <button w-25 px5 text-button @click="apply()">
          Apply
        </button>
      </div>
    </div>
  </dialog>
</template>

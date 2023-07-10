<script setup lang="ts">
import type { MarginObject } from '~/logic/types'
import { resolveMargin } from '~/logic/utils'

withDefaults(defineProps<{
  fullCustomizable?: boolean
}>(), {
  fullCustomizable: false,
})

const margin = defineModel<number | MarginObject>('modelValue', {
  type: [Object, Number],
  required: true,
})

const showFull = ref(typeof margin.value === 'number'
  ? false
  : margin.value.top !== margin.value.bottom
    || margin.value.left !== margin.value.right,
)

const x = computed({
  get: () => {
    if (typeof margin.value === 'number')
      return margin.value
    return margin.value.left
  },
  set: (value) => {
    if (typeof margin.value === 'number') {
      margin.value = value
      return
    }
    margin.value.left = value
    margin.value.right = value
  },
})

const y = computed({
  get: () => {
    if (typeof margin.value === 'number')
      return margin.value

    return margin.value.top
  },
  set: (value) => {
    if (typeof margin.value === 'number') {
      margin.value = value
      return
    }
    margin.value.top = value
    margin.value.bottom = value
  },
})

function toggleFull() {
  showFull.value = !showFull.value
  if (!showFull.value && typeof margin.value !== 'number') {
    margin.value.left = margin.value.right
    margin.value.top = margin.value.bottom
  }
}
</script>

<template>
  <template v-if="(typeof margin === 'number')">
    <OptionItem title="Margin" div @reset="margin = 2">
      <OptionSlider v-model="margin" :min="0" :max="20" :step="1" />
      <button
        icon-button-sm
        @click="margin = resolveMargin(margin)"
      >
        <div i-ri-arrow-down-s-line />
      </button>
    </OptionItem>
  </template>
  <template v-else>
    <OptionItem title="Margin" div @reset="margin = { top: 2, left: 2, right: 2, bottom: 2 }">
      <div flex-auto />
      <button
        v-if="fullCustomizable"
        icon-button-sm
        @click="toggleFull()"
      >
        <div i-ri-drag-move-line />
      </button>
      <button
        icon-button-sm
        @click="margin = margin.top"
      >
        <div i-ri-arrow-up-s-line />
      </button>
    </OptionItem>

    <template v-if="showFull && fullCustomizable">
      <OptionItem title="Left" nested>
        <OptionSlider v-model="margin.left" :min="0" :max="20" :step="1" />
      </OptionItem>
      <OptionItem title="Right" nested>
        <OptionSlider v-model="margin.right" :min="0" :max="20" :step="1" />
      </OptionItem>
      <OptionItem title="Top" nested>
        <OptionSlider v-model="margin.top" :min="0" :max="20" :step="1" />
      </OptionItem>
      <OptionItem title="Bottom" nested>
        <OptionSlider v-model="margin.bottom" :min="0" :max="20" :step="1" />
      </OptionItem>
    </template>
    <template v-else>
      <OptionItem title="X" nested>
        <OptionSlider v-model="x" :min="0" :max="20" :step="1" />
      </OptionItem>
      <OptionItem title="Y" nested>
        <OptionSlider v-model="y" :min="0" :max="20" :step="1" />
      </OptionItem>
    </template>
  </template>
</template>

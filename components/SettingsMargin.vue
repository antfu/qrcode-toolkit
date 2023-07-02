<script setup lang="ts">
import type { MarginObject } from '~/logic/types'
import { resolveMargin } from '~/logic/utils'

const margin = defineModel<number | MarginObject>('modelValue', {
  type: Object,
  required: true,
})
</script>

<template>
  <template v-if="(typeof margin === 'number')">
    <OptionItem title="Margin">
      <OptionSlider v-model="margin" :min="0" :max="20" :step="1" />
      <button
        text-sm icon-button
        title="Randomize"
        @click="margin = resolveMargin(margin)"
      >
        <div i-ri-arrow-down-s-line />
      </button>
    </OptionItem>
  </template>
  <template v-else>
    <OptionItem title="Margin">
      <div flex-auto />
      <button
        text-sm icon-button
        title="Randomize"
        @click="margin = margin.top"
      >
        <div i-ri-arrow-up-s-line />
      </button>
    </OptionItem>
    <OptionItem title="Top" nested>
      <OptionSlider v-model="margin.top" :min="0" :max="20" :step="1" />
    </OptionItem>
    <OptionItem title="Bottom" nested>
      <OptionSlider v-model="margin.bottom" :min="0" :max="20" :step="1" />
    </OptionItem>
    <OptionItem title="Left" nested>
      <OptionSlider v-model="margin.left" :min="0" :max="20" :step="1" />
    </OptionItem>
    <OptionItem title="Right" nested>
      <OptionSlider v-model="margin.right" :min="0" :max="20" :step="1" />
    </OptionItem>
  </template>
</template>

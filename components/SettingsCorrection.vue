<script setup lang="ts">
import type { ComparionState } from 'logic/types'

defineProps<{
  state: ComparionState
}>()
</script>

<template>
  <OptionItem title="Ambiguity Threshold" @reset="state.diffThreshold = 3">
    <OptionSlider v-model="state.diffThreshold" :min="0.1" :max="20" :step="0.01" />
  </OptionItem>

  <OptionItem title="Correction Opacity" @reset="state.correctionOpacity = 1">
    <OptionSlider v-model="state.correctionOpacity" :min="0" :max="4" :step="0.01" />
  </OptionItem>

  <OptionItem title="Correction Blur" @reset="state.correctionBlur = 0">
    <OptionSlider v-model="state.correctionBlur" :min="0" :max="20" :step="0.05" />
  </OptionItem>

  <OptionItem title="Correction Blend">
    <OptionSelectGroup
      v-model="state.correctionBlendMode"
      :options="['none', 'overlay', 'darken', 'lighten', 'difference']"
    />
  </OptionItem>
</template>

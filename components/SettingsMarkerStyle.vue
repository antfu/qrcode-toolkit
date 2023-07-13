<script setup lang="ts">
import type { QrCodeGeneratorMarkerState } from 'logic/types'
import { MarkerInnerShapeIcons, MarkerInnerShapes, MarkerShapeIcons, MarkerShapes, PixelStyleIcons, PixelStyles } from '~/logic/types'

const props = defineProps<{
  state: QrCodeGeneratorMarkerState
  number?: string
  nested?: boolean
}>()

const supportPixelStyle = computed(() => {
  return [
    'square',
    // 'circle',
    'plus',
    'box',
    // 'octagon',
    'random',
    'tiny-plus',
  ].includes(props.state.markerShape) || [
    'square',
    // 'circle',
    'plus',
    // 'diamond',
    // 'eye',
  ].includes(props.state.markerInnerShape)
})
</script>

<template>
  <OptionItem :title="[number, 'Pixel'].filter(Boolean).join(' ')" :nested="nested">
    <OptionSelectGroup
      v-if="supportPixelStyle"
      v-model="state.markerStyle"
      :options="PixelStyles"
      :classes="PixelStyleIcons"
    />
    <OptionSelectGroup
      v-model="state.markerStyle"
      :options="['auto']"
    />
  </OptionItem>

  <OptionItem :title="[number, 'Shape'].filter(Boolean).join(' ')" :nested="nested">
    <OptionSelectGroup
      v-model="state.markerShape"
      :options="MarkerShapes"
      :classes="MarkerShapeIcons"
    />
  </OptionItem>

  <OptionItem :title="[number, 'Inner'].filter(Boolean).join(' ')" :nested="nested">
    <OptionSelectGroup
      v-model="state.markerInnerShape"
      :options="MarkerInnerShapes"
      :classes="MarkerInnerShapeIcons"
    />
    <OptionSelectGroup
      v-model="state.markerInnerShape"
      :options="['auto']"
    />
  </OptionItem>
</template>

<script setup lang="ts">
import type { QrCodeGeneratorMarkerState } from 'logic/types'
import { MarkerInnerShapeIcons, MarkerInnerShapes, MarkerShapeIcons, MarkerShapes, PixelStyleIcons, PixelStyles } from '~/logic/types'

defineProps<{
  state: QrCodeGeneratorMarkerState
  number?: string
  nested?: boolean
}>()
</script>

<template>
  <OptionItem :title="[number, 'Pixel'].filter(Boolean).join(' ')" :nested="nested">
    <OptionSelectGroup
      v-if="state.markerShape !== 'circle'"
      v-model="state.markerStyle"
      :options="state.markerShape === 'octagon' ? PixelStyles.slice(0, 2) : PixelStyles"
      :classes="state.markerShape === 'octagon' ? PixelStyleIcons.slice(0, 2) : PixelStyleIcons"
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

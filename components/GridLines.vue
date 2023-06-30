<script setup lang="ts">
const props = defineProps<{
  gridSize: number
  gridColor: string
  gridOpacity: number
  gridMarginSize: number
  gridMarginColor: string
}>()

const gridCellSize = computed(() => 100 / props.gridSize)
</script>

<template>
  <!-- Grids -->
  <div
    v-for="i in gridSize"
    :key="i"
    absolute z-100
    :style="{
      left: `${(i - 1) * gridCellSize}%`,
      height: `100%`,
      border: '0.5px solid',
      borderColor: gridColor,
      opacity: gridOpacity,
    }"
  />
  <div
    v-for="i in gridSize"
    :key="i"
    absolute z-100
    :style="{
      top: `${(i - 1) * gridCellSize}%`,
      width: `100%`,
      border: '0.5px solid',
      borderColor: gridColor,
      opacity: gridOpacity,
    }"
  />
  <!-- QR Code Main frame -->
  <div
    v-if="gridMarginSize"
    absolute z-100
    :style="{
      left: `${gridCellSize * gridMarginSize}%`,
      right: `${gridCellSize * gridMarginSize}%`,
      bottom: `${gridCellSize * gridMarginSize}%`,
      top: `${gridCellSize * gridMarginSize}%`,
      border: '2px solid',
      borderColor: gridMarginColor,
      opacity: gridOpacity * 1.5,
    }"
  />
</template>

<script setup lang="ts">
import type { MarginObject } from '~/logic/types'
import { resolveMargin } from '~/logic/utils'

const props = defineProps<{
  gridSize: number
  gridColor: string
  gridOpacity: number
  gridMarginSize: number | MarginObject
  gridMarginColor: string
  darkenMargin?: boolean
}>()

const gridCellSize = computed(() => 100 / props.gridSize)

const margin = computed(() => resolveMargin(props.gridMarginSize))
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
      left: `${gridCellSize * margin.left}%`,
      right: `${gridCellSize * margin.right}%`,
      bottom: `${gridCellSize * margin.bottom}%`,
      top: `${gridCellSize * margin.top}%`,
      border: '2px solid',
      borderColor: gridMarginColor,
      opacity: gridOpacity * 1.5,
    }"
  />

  <template v-if="darkenMargin">
    <div
      absolute z-110
      :style="{
        left: 0,
        width: `${gridCellSize * margin.left}%`,
        bottom: 0,
        top: 0,
        background: '#0005',
      }"
    />
    <div
      absolute z-110
      :style="{
        right: 0,
        width: `${gridCellSize * margin.right}%`,
        bottom: 0,
        top: 0,
        background: '#0005',
      }"
    />
    <div
      absolute z-110
      :style="{
        left: `${gridCellSize * margin.left}%`,
        right: `${gridCellSize * margin.right}%`,
        top: 0,
        height: `${gridCellSize * margin.top}%`,
        background: '#0005',
      }"
    />
    <div
      absolute z-110
      :style="{
        left: `${gridCellSize * margin.left}%`,
        right: `${gridCellSize * margin.right}%`,
        bottom: 0,
        height: `${gridCellSize * margin.bottom}%`,
        background: '#0005',
      }"
    />
  </template>
</template>

<script setup lang="ts">
import type { Segment } from '~/logic/types'

const props = defineProps<{
  segment: Segment
}>()

const canvas = ref<HTMLCanvasElement>()

watchEffect(() => {
  if (!canvas.value)
    return
  canvas.value.width = props.segment.data.width
  canvas.value.height = props.segment.data.height
  canvas.value.getContext('2d')?.putImageData(props.segment.data, 0, 0)
})
</script>

<template>
  <canvas ref="canvas" w-7 />
</template>

<script setup lang="ts">
const props = defineProps<{
  max: number
  min: number
  step: number
}>()

const value = defineModel<number>('modelValue', {
  type: Number,
})
</script>

<template>
  <input v-model.number="value" type="range" v-bind="props" w-60>
  <input v-model.number="value" type="number" v-bind="props" border="~ base rounded" w-20 bg-gray:10 pl2 text-sm>
</template>

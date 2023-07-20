<script setup lang="ts">
const props = defineProps<{
  max: number
  min: number
  step: number
  unit?: string
}>()

const value = defineModel<number>('modelValue', {
  type: Number,
})
</script>

<template>
  <input v-model.number="value" type="range" class="slider" v-bind="props" w-60 flex-auto>
  <div relative>
    <input v-model.number="value" type="number" v-bind="props" border="~ base rounded" h-22px w-20 bg-secondary pl2 text-sm>
    <span pointer-events-none absolute right-1 top-1 text-xs op25>{{ props.unit }}</span>
  </div>
</template>

<style>
.slider {
  appearance: none;
  height: 22px;
  outline: none;
  opacity: 0.7;
  -webkit-transition: .2s;
  transition: opacity .2s;
  --uno: border border-base rounded of-hidden bg-secondary;
}

.slider:hover {
  opacity: 1;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 5px;
  height: 22px;
  background: #fff;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 5px;
  height: 22px;
  background: #fff;
  cursor: pointer;
}
</style>

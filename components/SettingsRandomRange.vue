<script setup lang="ts">
const props = defineProps<{
  max: number
  min: number
  step: number
  title: string
  nested?: boolean | number
}>()

const model = defineModel<number | [number, number]>('modelValue', {
  type: Object,
  required: true,
})

const lower = computed({
  get: () => {
    if (typeof model.value === 'number')
      return model.value
    return model.value[0]
  },
  set: (value) => {
    if (typeof model.value === 'number') {
      model.value = value
      return
    }
    model.value[0] = value
  },
})

const upper = computed({
  get: () => {
    if (typeof model.value === 'number')
      return model.value
    return model.value[1]
  },
  set: (value) => {
    if (typeof model.value === 'number') {
      model.value = value
      return
    }
    model.value[1] = value
  },
})

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function toggle() {
  if (typeof model.value === 'number') {
    model.value = [
      clamp(model.value - props.step * 10, props.min, props.max),
      clamp(model.value + props.step * 10, props.min, props.max),
    ]
  }
  else { model.value = (model.value[0] + model.value[1]) / 2 }
}

const childNested = computed(() => {
  if (typeof props.nested === 'number')
    return props.nested + 1
  if (props.nested)
    return 2
  return 1
})
</script>

<template>
  <template v-if="(typeof model === 'number' || model === null)">
    <OptionItem :title="title" :nested="nested">
      <OptionSlider v-model="model" :min="min" :max="max" :step="step" />
      <button
        icon-button-sm
        title="Expand to use random"
        @click="toggle()"
      >
        <div i-ri-arrow-down-s-line />
      </button>
    </OptionItem>
  </template>
  <template v-else>
    <OptionItem :title="title" :nested="nested">
      <div flex-auto />
      <button
        icon-button-sm
        @click="toggle()"
      >
        <div i-ri-arrow-up-s-line />
      </button>
    </OptionItem>
    <OptionItem title="Min" :nested="childNested">
      <OptionSlider v-model="lower" :min="min" :max="upper" :step="step" />
    </OptionItem>
    <OptionItem title="Max" :nested="childNested">
      <OptionSlider v-model="upper" :min="lower" :max="max" :step="step" />
    </OptionItem>
  </template>
</template>

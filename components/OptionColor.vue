<script setup lang="ts">
const value = defineModel<string>('modelValue', {
  type: String,
})
</script>

<template>
  <div border="~ base rounded" flex="~ gap-2 items-center" relative bg-secondary p0.5 px1.5>
    <div h-4 w-4 border="~ base rounded-full" :style="{ background: value }" />
    <div text-sm font-mono>
      {{ value }}
    </div>
    <input v-model="value" type="color" absolute inset-0 z-10 opacity-0.1>
  </div>
</template>

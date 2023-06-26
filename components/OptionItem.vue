<script setup lang="ts">
defineProps<{
  title: string
  nested?: boolean
  div?: boolean
}>()

const emit = defineEmits<{
  (event: 'reset'): void
}>()

function reset() {
  emit('reset')
}
</script>

<template>
  <component :is="div ? 'div' : 'label'" flex="~ prefer-row gap-2" select-none>
    <div w-35 flex="~ gap-1 items-center">
      <div v-if="nested" i-ri-corner-down-right-line ml1 op40 />
      <div @dblclick="reset">
        {{ title }}
      </div>
    </div>
    <slot />
  </component>
</template>

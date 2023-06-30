<script setup lang="ts">
defineProps<{
  title: string
  nested?: boolean
  div?: boolean
  description?: string
}>()

const emit = defineEmits<{
  (event: 'reset'): void
}>()

function reset() {
  emit('reset')
}
</script>

<template>
  <component :is="div ? 'div' : 'label'" flex="~ row gap-2 items-center" select-none>
    <div w-35 flex="~ gap-1 items-center">
      <div v-if="nested" i-ri-corner-down-right-line ml1 op40 />
      <div v-if="!description" text-sm op75 @dblclick="reset">
        {{ title }}
      </div>
      <VTooltip v-else placement="left" distance="10">
        <div text-sm op75 @dblclick="reset">
          {{ title }}
        </div>
        <template #popper>
          <div text-sm>
            {{ description }}
          </div>
        </template>
      </VTooltip>
    </div>
    <slot />
  </component>
</template>

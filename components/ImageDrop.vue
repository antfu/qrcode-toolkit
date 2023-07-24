<script setup lang="ts">
defineProps<{
  title: string
}>()

const value = defineModel<string>('modelValue', {
  type: String,
})

function clear() {
  value.value = ''
}
</script>

<template>
  <div
    border="1 base rounded"
    flex="~ col items-center justify-center"
    hover="bg-hex-88888809"
    :class="value ? '' : 'border-dashed'"
    relative aspect-ratio-1 h-50 w-50 cursor-pointer of-hidden
  >
    <img
      v-if="value"
      :src="value"
      absolute inset-0 aspect-ratio-1 rounded object-contain op100
    >
    <template v-else>
      <div i-ri-upload-line text-lg op50 />
      <div text-center op50>
        Upload
      </div>
    </template>
    <button v-if="value" absolute right-0 top-0 z-20 m1 rounded-full bg-hex-8882 p1 op50 hover:op75 title="Remove image">
      <div i-carbon-close @click="clear" />
    </button>
    <ImageUpload v-model="value" />
  </div>
</template>

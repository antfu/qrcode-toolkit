<script setup lang="ts">
defineProps<{
  modelValue?: string | undefined
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', dataurl: string): void
}>()

async function read(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file)
    return

  const reader = new FileReader()
  const promise = new Promise<string>((resolve, reject) => {
    reader.onload = () => {
      resolve(reader.result as any)
    }
    reader.onerror = reject
  })
  reader.readAsDataURL(file)
  emit('update:modelValue', await promise)
}
</script>

<template>
  <input
    type="file" accept="image/*"
    absolute bottom-0 left-0 right-0 top-0 z-10 cursor-pointer opacity-0.1
    @input="read"
  >
</template>

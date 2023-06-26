<script setup lang="ts">
const props = defineProps<{
  data?: string
  title: string
}>()

const emit = defineEmits<{
  (event: 'data', dataurl: string): void
}>()

const dataurl = ref(props.data)

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
  dataurl.value = await promise
  emit('data', dataurl.value)
}

function clear() {
  dataurl.value = ''
  emit('data', dataurl.value)
}
</script>

<template>
  <div
    border="2 base dashed rounded-lg" flex="~ col gap-2 items-center justify-center"
    relative h-50 w-50 cursor-pointer of-hidden hover:bg-gray:10
  >
    <slot :data="dataurl">
      <img
        v-if="dataurl"
        :src="dataurl"
        absolute bottom-0 left-0 right-0 top-0 rounded-lg op50
        style="object-fit: contain"
      >
      <div v-else i-ri-upload-line text-lg op50 />
      <div z-1 text-center>
        {{ title }}
      </div>
      <button v-if="dataurl" absolute right-0 top-0 z-20 p2 op50 hover:op100 title="Remove image">
        <div i-carbon-close @click="clear" />
      </button>
    </slot>
    <input
      type="file" accept="image/*"
      absolute bottom-0 left-0 right-0 top-0 z-10 opacity-0.1
      @input="read"
    >
  </div>
</template>

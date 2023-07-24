<script setup lang="ts">
import type { State } from '~/logic/types'
import { scanQRCodeFromDataUrl } from '~/logic/scan'

const props = defineProps<{
  modelValue: boolean
  qrcode: string
  state: State
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const result = ref<string | null>()
const error = ref<Error | null>()

watch(() => props.qrcode, () => {
  result.value = null
  error.value = null
  scanQRCodeFromDataUrl(props.qrcode)
    .then((text) => {
      // eslint-disable-next-line no-console
      console.log('scanned', text)
      result.value = text.result?.text
      error.value = text.error
      if (!result.value && !error.value)
        error.value = new Error('Failed to scan QR code')
    })
    .catch((e) => {
      error.value = e
    })
}, { immediate: true })

function close() {
  emit('update:modelValue', false)
}

function cancel() {
  close()
}

function apply() {
  props.state.qrcode.text = result.value ?? ''
  close()
}
</script>

<template>
  <dialog
    :open="modelValue"
    class="fixed inset-0 z-50000"
    @close="cancel()"
  >
    <div
      class="fixed inset-0 bg-black/20 backdrop-blur-10"
      @click="apply()"
    />
    <div class="relative z-10 max-w-full w-[30rem] rounded-lg p-4 bg-base" flex="~ col gap-4" border="~ base">
      <h1 text-xl>
        Scan QR Code
      </h1>
      <div border="~ base rounded-lg" relative of-hidden>
        <img
          :src="qrcode"
          w-full object-cover
        >
      </div>

      <div h-20>
        <div v-if="error" border="~ red-6/60 rounded" bg-red-5:10 px4 py3 text-sm>
          Failed to scan QR code: {{ error }}
          <br>
          <span text-xs op50>Note that this web based QR Code scanner is not very tolerant, it does not represent this image is not scannable at all.</span>
        </div>
        <div v-else-if="result != null">
          <div text-sm op50>
            Result
          </div>
          <pre text-green3 v-text="result || `(empty)`" />
        </div>
        <div v-else animate-pulse>
          Scanning...
        </div>
      </div>

      <div flex="~ gap-2 justify-end" mt-5>
        <button op75 text-button @click="cancel()">
          Cancel
        </button>
        <button text-button :disabled="!result" :class="result ? '' : 'op50'" @click="apply()">
          Apply to text
        </button>
      </div>
    </div>
  </dialog>
</template>

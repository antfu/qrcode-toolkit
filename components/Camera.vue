<script setup lang="ts">
import type { ScanResult } from 'qrcode-opencv-wechat'
import { scan } from 'qrcode-opencv-wechat'
import type { State } from '~/logic/types'

const props = defineProps<{
  state: State
}>()

const videoEl = ref<HTMLVideoElement>()

const error = ref()
const isScanning = ref(false)

let stream: MediaStream | null = null

const { devices } = useDevicesList({
  constraints: {
    audio: false,
    video: true,
  },
})

const cameras = computed(() => devices.value.filter(i => i.kind === 'videoinput'))
const selectedCamera = ref(cameras.value[0]?.deviceId)
const result = ref<ScanResult>()
const count = ref(0)

watchEffect(() => {
  if (!selectedCamera.value)
    selectedCamera.value = cameras.value[0]?.deviceId
})

function dispose() {
  isScanning.value = false
  stream?.getTracks().forEach(track => track.stop())
  stream = null
}

function display() {
  dispose()

  navigator.mediaDevices
    .getUserMedia({
      audio: false,
      video: {
        width: 512,
        height: 512,
        deviceId: selectedCamera.value,
      },
    })
    .then((_stream) => {
      stream = _stream
      videoEl.value!.srcObject = stream
      videoEl.value!.play()

      start()
    })
    .catch((e) => {
      error.value = e
    })
}

watch(() => selectedCamera.value, (v) => {
  if (v)
    display()
})

async function scanFrame() {
  if (!isScanning.value)
    return
  count.value += 1
  const canvas = document.createElement('canvas')
  canvas.width = videoEl.value!.videoWidth
  canvas.height = videoEl.value!.videoHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(videoEl.value!, 0, 0, canvas.width, canvas.height)
  try {
    result.value = await scan(canvas)
    // eslint-disable-next-line no-console
    console.log('Scan result', result.value)
    if (result.value?.text) {
      videoEl.value?.pause()
      isScanning.value = false
    }
  }
  catch (e) {
    console.error(e)
  }
}

function start() {
  if (!isScanning.value) {
    result.value = undefined
    videoEl.value?.play()
    isScanning.value = true
    setInterval(() => {
      scanFrame()
    }, 100)
  }
}

onUnmounted(dispose)
</script>

<template>
  <div flex="~ col gap-2">
    <div border="~ base rounded" flex="~ col gap-2" p4>
      <OptionItem title="Camera" div>
        <OptionSelectGroup
          v-model="selectedCamera"
          :titles="cameras.map(i => i.label)"
          :options="cameras.map(i => i.deviceId)"
        />
      </OptionItem>
    </div>
    <div relative mxa aspect-ratio-1 max-w-full w-120>
      <video ref="videoEl" border="~ base rounded" aspect-ratio-1 w-full />
      <div absolute bottom-0 right-0 p2 text-sm font-mono op50>
        x{{ count }}
      </div>
      <div
        v-if="result?.text"
        absolute bottom-0 left-0 right-0 top-0 bg-green:20 text-green
        backdrop-blur-4 backdrop-brightness-50
        flex="~ gap-3 col items-center justify-center"
      >
        <div i-ri-checkbox-circle-fill text-3xl />
        <div font-mono>
          {{ result?.text }}
        </div>
        <button text-button @click="start()">
          Continue
        </button>
      </div>
    </div>
  </div>
</template>

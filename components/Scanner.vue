<!-- eslint-disable no-console -->
<script setup lang="ts">
import { debounce } from 'perfect-debounce'
import type { ScanResult } from 'qrcode-opencv-wechat'
import { ready, scan } from 'qrcode-opencv-wechat'
import { defaultScannerState } from '~/logic/state'
import { view } from '~/logic/view'
import type { State } from '~/logic/types'

const props = defineProps<{
  state: State
}>()

const state = computed(() => props.state.scanner)
const dataUrlInput = ref<string>('')
const canvasPreview = ref<HTMLCanvasElement>()
const canvasRect = ref<HTMLCanvasElement>()
const result = ref<ScanResult>()
const reading = ref(false)
const loading = ref(true)
const error = ref<any>()
const randomTrying = ref(false)
const randomTryingCount = ref(0)

onMounted(() => {
  ready()
    .then(() => {
      loading.value = false
      console.log('Scanner loaded')
    })
    .catch((e) => {
      error.value = e
      console.error(e)
    })
})

const image = ref<HTMLImageElement>()

async function loadImage() {
  image.value = undefined
  if (dataUrlInput.value) {
    const img = new Image()
    const promise = new Promise(resolve => img.onload = resolve)
    img.src = dataUrlInput.value
    await promise
    image.value = img
  }
}

watch(
  () => dataUrlInput.value,
  async () => {
    await loadImage()
  },
  { immediate: true },
)

async function runEager(display = true) {
  if (!image.value)
    return

  clear()
  reading.value = true
  const { width, height } = image.value
  let w = width
  let h = height
  if (width > height) {
    if (height > state.value.resize) {
      w = width * state.value.resize / height
      h = state.value.resize
    }
  }
  else {
    if (width > state.value.resize) {
      h = height * state.value.resize / width
      w = state.value.resize
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.filter = [
    state.value.grayscale ? 'grayscale(1)' : '',
    `contrast(${state.value.contrast / 100})`,
    `brightness(${state.value.brightness / 100})`,
    `blur(${state.value.blur}px)`,
  ].filter(Boolean).join(' ')
  ctx.drawImage(image.value, 0, 0, image.value.width, image.value.height, 0, 0, w, h)

  if (display) {
    canvasPreview.value!.width = w
    canvasPreview.value!.height = h
    const ctxPreview = canvasPreview.value!.getContext('2d')!
    ctxPreview.drawImage(canvas, 0, 0)
  }

  try {
    result.value = await scan(canvas, { includeRectCanvas: display })
    console.log('Scan result', result.value)

    if (result.value.rectCanvas) {
      canvasRect.value!.width = result.value.rectCanvas.width
      canvasRect.value!.height = result.value.rectCanvas.height
      const ctx = canvasRect.value!.getContext('2d')!
      ctx.clearRect(0, 0, canvasRect.value!.width, canvasRect.value!.height)
      ctx.drawImage(result.value.rectCanvas, 0, 0)
    }

    return result.value
  }
  catch (e) {
    error.value = e
    console.error(e)
  }
  finally {
    reading.value = false
  }
}

const run = debounce(runEager, 500)

const { copy, copied } = useClipboard()

watch(
  () => [state.value, image.value],
  () => {
    if (randomTrying.value)
      return
    randomTryingCount.value = 0
    if (!canvasPreview.value || !canvasRect.value || !dataUrlInput.value || !image.value)
      return
    run()
  },
  { deep: true, immediate: true },
)

function clear() {
  error.value = null
  reading.value = false
  result.value = undefined
  canvasPreview.value?.getContext('2d')!.clearRect(0, 0, canvasPreview.value!.width, canvasPreview.value!.height)
  canvasRect.value?.getContext('2d')!.clearRect(0, 0, canvasRect.value!.width, canvasRect.value!.height)
}

function random() {
  state.value.blur = Math.round(Math.random() * 1.5 * 10) / 10
  state.value.brightness = Math.round(Math.random() * 300 + 100)
  state.value.contrast = Math.round(Math.random() * 500 + 150)
  state.value.resize = Math.round(Math.random() * 20) * 10 + 150
}

async function randomTries() {
  randomTrying.value = true
  randomTryingCount.value = 0
  const tries = 50
  try {
    for (let i = 0; i <= tries; i++) {
      await new Promise(resolve => setTimeout(resolve, 0))
      randomTryingCount.value = i
      random()
      const result = await runEager(false)
      if (result?.text)
        break
    }
    await runEager(true)
  }
  finally {
    randomTrying.value = false
  }
}

function reset() {
  Object.assign(state.value, defaultScannerState())
}

const { isOverDropZone } = useDropZone(document.body, {
  onDrop(files) {
    if (view.value !== 'scan')
      return
    if (!files)
      return

    const file = files[0]
    if (file.type === 'image/png' || file.type === 'image/jpeg') {
      const reader = new FileReader()
      reader.onload = () => {
        const data = reader.result as string
        dataUrlInput.value = data
      }
      reader.readAsDataURL(file)
    }
  },
})
</script>

<template>
  <div flex="~ col gap-3">
    <div grid="~ cols-3 gap-2" mt8>
      <div text-center text-xs op50>
        Upload
      </div>
      <div text-center text-xs op50>
        Preprocessed
      </div>
      <div text-center text-xs op50>
        Matched
      </div>
      <ImageDrop
        v-model="dataUrlInput"
        title="QRCode"
        h-auto w-full
        @update:model-value="clear()"
      />
      <div border="~ base rounded" :class="dataUrlInput ? '' : 'op50'" aspect-ratio-1 h-full w-full flex>
        <canvas v-show="dataUrlInput" ref="canvasPreview" ma h-full w-full object-contain />
        <div v-if="!dataUrlInput" i-ri-prohibited-line ma text-4xl op20 />
      </div>
      <div border="~ base rounded" :class="result?.rectCanvas ? '' : 'op50'" aspect-ratio-1 w-full flex>
        <canvas v-show="result?.rectCanvas" ref="canvasRect" ma h-full w-full object-contain />
        <div v-if="!result?.rectCanvas" i-ri-prohibited-line ma text-4xl op20 />
      </div>
    </div>
    <div
      rounded p4 border="~ base op50"
      flex="~ gap-2 items-center"
      :class="
        error
          ? 'bg-red-500:10 text-red'
          : loading
            ? 'text-cyan'
            : !dataUrlInput
              ? 'text-true-gray:80'
              : result?.text
                ? 'bg-green-500:10 text-green border-current'
                : (reading || randomTrying)
                  ? 'bg-gray-500:10 text-gray'
                  : 'bg-orange-500:10 text-orange border-current'
      "
    >
      <div
        :class="
          error
            ? 'i-ri-bug-fill'
            : loading
              ? 'i-ri-loader-4-fill animate-spin'
              : !dataUrlInput
                ? 'i-ri-qr-scan-2-line'
                : result?.text
                  ? 'i-ri-checkbox-circle-fill'
                  : (reading || randomTrying)
                    ? 'i-ri-loader-4-fill animate-spin'
                    : 'i-ri-error-warning-fill'
        "
      />
      <div v-if="error">
        Error: {{ error }}
      </div>
      <div v-else-if="loading" animate-pulse>
        Loading models...
      </div>
      <div v-else-if="!dataUrlInput">
        Upload a image to scan
      </div>
      <div v-else-if="reading || randomTrying" animate-pulse>
        Scanning... <span v-if="randomTryingCount" text-xs op50>(x{{ randomTryingCount }})</span>
      </div>
      <template v-else-if="result?.text">
        <div font-mono>
          {{ result?.text }}
        </div>
        <div flex-auto />
        <button my--2 text-sm icon-button @click="copy(result?.text)">
          <div :class="copied ? 'i-ri-check-line' : 'i-ri-clipboard-line'" />
        </button>
      </template>
      <div v-else>
        No QR code found
      </div>
    </div>

    <template v-if="dataUrlInput">
      <div border="~ base rounded" flex="~ col gap-2" p4>
        <OptionItem title="Grayscale">
          <OptionCheckbox v-model="state.grayscale" />
        </OptionItem>
        <OptionItem title="Resize" @reset="state.resize = 300">
          <OptionSlider v-model="state.resize" :min="150" :max="1000" :step="10" />
        </OptionItem>
        <OptionItem title="Contrast" @reset="state.contrast = 100">
          <OptionSlider v-model="state.contrast" :min="0" :max="1000" :step="10" />
        </OptionItem>
        <OptionItem title="Brightness" @reset="state.brightness = 100">
          <OptionSlider v-model="state.brightness" :min="0" :max="1000" :step="10" />
        </OptionItem>
        <OptionItem title="Blur">
          <OptionSlider v-model="state.blur" :min="0" :max="10" :step="0.05" />
        </OptionItem>
      </div>

      <div flex="~ gap-2 items-center">
        <button
          text-sm op75 text-button hover:op100
          @click="random()"
        >
          <div i-ri-refresh-line />
          Randomize State
        </button>
        <button
          text-sm op75 text-button hover:text-yellow hover:op100
          @click="randomTries()"
        >
          <div i-ri-refresh-fill />
          Random Tries (x50 times)
        </button>
        <div v-if="randomTryingCount" text-xs op50>
          {{ randomTryingCount }} tries
        </div>
        <div flex-auto />
        <button
          text-sm op75 text-button hover:text-red hover:op100
          @click="reset()"
        >
          <div i-ri-delete-bin-6-line />
          Reset State
        </button>
      </div>
    </template>

    <div flex="~ gap-3" border="~ base rounded" p4 op45 transition hover:op75>
      <span i-ri-lightbulb-line mt-2 flex-none text-lg text-yellow />
      <div>
        <p mb4>
          This scanner uses the scanner algorithm open sourced by WeChat, based on OpenCV.
          It provides much better recognizability than average scanners.
          Try adjusting the preprocessing options a couple times to get the best result.
        </p>
        <p>
          The detection and decoding is done locally in your browser.
          This is made possible by compiling OpenCV with WeChat's scanner into WebAssembly.
          If you are interested in learning more, check out <a href="https://github.com/antfu/qrcode-opencv-wechat" target="_blank" font-mono op75 hover:underline hover:op100>qrcode-opencv-wechat</a>.
        </p>
      </div>
    </div>
  </div>

  <div v-if="isOverDropZone" fixed bottom-0 left-0 right-0 top-0 z-200 flex bg-black:20 backdrop-blur-10>
    <div
      id="upload-zone-qrcode" flex="~ col gap-3 items-center justify-center" m10 ml-1 w-full op40
      border="3 dashed transparent rounded-xl"
    >
      <div i-carbon-qr-code text-20 />
      <div text-xl>
        Scan Image
      </div>
    </div>
  </div>
</template>

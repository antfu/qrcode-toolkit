<!-- eslint-disable no-console -->
<script setup lang="ts">
import { debounce } from 'perfect-debounce'
import type { ScanResult } from 'qr-scanner-wechat'
import { ready, scan } from 'qr-scanner-wechat'
import { shuffle } from '@antfu/utils'
import { dataUrlScannerUpload, defaultScannerState } from '~/logic/state'
import { view } from '~/logic/view'
import type { State } from '~/logic/types'

const props = defineProps<{
  state: State
}>()

const state = computed(() => props.state.scanner)
const canvasPreview = ref<HTMLCanvasElement>()
const canvasRect = ref<HTMLCanvasElement>()
const result = ref<ScanResult>()
const reading = ref(false)
const loading = ref(true)
const error = ref<any>()
const controlling = ref(false)
const triesCount = ref(0)

const dimension = ref<{
  upload?: {
    width: number
    height: number
  }
  preprocessed?: {
    width: number
    height: number
  }
  matched?: {
    width: number
    height: number
  }
}>({})

const [DefineLock, ReuseLock] = createReusableTemplate<{
  name: keyof State['scanner']
}>()

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
  if (dataUrlScannerUpload.value) {
    const img = new Image()
    const promise = new Promise(resolve => img.onload = resolve)
    img.src = dataUrlScannerUpload.value
    await promise
    image.value = img
    dimension.value.upload = {
      width: img.width,
      height: img.height,
    }
  }
  else {
    dimension.value.upload = undefined
  }
}

watch(
  () => dataUrlScannerUpload.value,
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
  dimension.value.preprocessed = {
    width: w,
    height: h,
  }
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
      dimension.value.matched = {
        width: result.value.rectCanvas.width,
        height: result.value.rectCanvas.height,
      }
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
    if (controlling.value)
      return
    triesCount.value = 0
    if (!canvasPreview.value || !canvasRect.value || !dataUrlScannerUpload.value || !image.value)
      return
    run()
  },
  { deep: true, immediate: true },
)

function clear() {
  error.value = null
  reading.value = false
  result.value = undefined
  dimension.value.preprocessed = undefined
  dimension.value.matched = undefined
  canvasPreview.value?.getContext('2d')!.clearRect(0, 0, canvasPreview.value!.width, canvasPreview.value!.height)
  canvasRect.value?.getContext('2d')!.clearRect(0, 0, canvasRect.value!.width, canvasRect.value!.height)
}

function random() {
  if (!state.value.locks.includes('grayscale'))
    state.value.grayscale = Math.random() > 0.5
  if (!state.value.locks.includes('blur'))
    state.value.blur = Math.round(Math.random() * 1.5 * 10) / 10
  if (!state.value.locks.includes('brightness'))
    state.value.brightness = Math.round(Math.random() * 300 + 100)
  if (!state.value.locks.includes('contrast'))
    state.value.contrast = Math.round(Math.random() * 500 + 150)
  if (!state.value.locks.includes('resize'))
    state.value.resize = Math.round(Math.random() * 20) * 10 + 150
}

async function randomTries() {
  if (controlling.value)
    return
  controlling.value = true
  triesCount.value = 0
  const tries = 50
  try {
    for (let i = 0; i <= tries; i++) {
      await new Promise(resolve => setTimeout(resolve, 0))
      triesCount.value = i
      random()
      const result = await runEager(false)
      if (result?.text)
        break
    }
  }
  finally {
    controlling.value = false
  }
  await runEager(true)
}

async function narrowDown() {
  if (!result.value?.text || controlling.value)
    return

  controlling.value = true
  triesCount.value = 0

  let steps = [
    ['contrast', 100, 20, Math.round] as const,
    ['brightness', 100, 20, Math.round] as const,
    ['blur', 0, 0.1, (x: number) => Math.round(x * 10) / 10] as const,
  ]

  steps.push(...steps)
  steps.push(...steps)
  steps = shuffle(steps)

  let maxIterations = 100
  try {
    while (maxIterations--) {
      if (!steps.length)
        break

      const [key, targetValue, incremental, roundup] = steps[0]
      if (state.value.locks.includes(key)) {
        steps.shift()
        continue
      }

      console.log('Narrow down', key)

      const clone = { ...state.value }

      let changed = false

      const delta = state.value[key] - targetValue
      const sign = delta > 0 ? 1 : -1
      const move = Math.min(Math.abs(delta), incremental) * sign
      console.log('Narrow down', key, `Move:${move}`, `Distance:${delta}`)
      if (move !== 0) {
        state.value[key] = roundup(state.value[key] - move)
        changed = true
      }

      if (!changed) {
        steps.shift()
        continue
      }

      triesCount.value += 1
      const oldResult: ScanResult | undefined = result.value
      const res = await runEager(false)
      // no result, revert
      if (!res?.text) {
        Object.assign(state.value, clone)
        result.value = oldResult
        steps.shift()
        continue
      }
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }
  finally {
    controlling.value = false
  }

  await runEager(true)
}

function reset() {
  Object.assign(state.value, defaultScannerState())
}

function emptyState() {
  Object.assign(state.value, {
    grayscale: false,
    contrast: 100,
    brightness: 100,
    blur: 0,
    resize: 300,
  })
}

function toggleLock(name: keyof State['scanner']) {
  if (state.value.locks.includes(name))
    state.value.locks = state.value.locks.filter(i => i !== name)
  else
    state.value.locks.push(name)
}

const { isOverDropZone } = useDropZone(document.body, {
  onDrop(files) {
    if (view.value !== 'verify')
      return
    if (!files)
      return

    const file = files[0]
    if (file.type === 'image/png' || file.type === 'image/jpeg') {
      const reader = new FileReader()
      reader.onload = () => {
        const data = reader.result as string
        dataUrlScannerUpload.value = data
      }
      reader.readAsDataURL(file)
    }
  },
})
</script>

<template>
  <SafariWarning />
  <div flex="~ col gap-3">
    <div grid="~ cols-3 gap-2" mt8>
      <div text-center text-sm op50>
        Upload
      </div>
      <div text-center text-sm op50>
        Preprocessed
      </div>
      <div text-center text-sm op50>
        Matched
      </div>
      <ImageDrop
        v-model="dataUrlScannerUpload"
        title="QRCode"
        h-auto w-full
        @update:model-value="clear()"
      />
      <div border="~ base rounded" :class="dataUrlScannerUpload ? '' : 'op50'" aspect-ratio-1 h-full w-full flex>
        <canvas v-show="dataUrlScannerUpload" ref="canvasPreview" ma h-full w-full object-contain />
        <div v-if="!dataUrlScannerUpload" i-ri-prohibited-line ma text-4xl op20 />
      </div>
      <div border="~ base rounded" :class="result?.rectCanvas ? '' : 'op50'" aspect-ratio-1 w-full flex>
        <canvas v-show="result?.rectCanvas" ref="canvasRect" ma h-full w-full object-contain />
        <div v-if="!result?.rectCanvas" i-ri-prohibited-line ma text-4xl op20 />
      </div>
      <div text-center text-xs font-mono op50>
        {{ dimension.upload ? `${Math.round(dimension.upload.width)}x${Math.round(dimension.upload.height)}` : '' }}
      </div>
      <div text-center text-xs font-mono op50>
        {{ dimension.preprocessed ? `${Math.round(dimension.preprocessed.width)}x${Math.round(dimension.preprocessed.height)}` : '' }}
      </div>
      <div text-center text-xs font-mono op50>
        {{ dimension.matched ? `${Math.round(dimension.matched.width)}x${Math.round(dimension.matched.height)}` : '' }}
      </div>
    </div>
    <div
      rounded p4 border="~ base"
      flex="~ gap-2 items-center"
      :class="
        error
          ? 'bg-red-500:10 text-red border-current'
          : loading
            ? 'text-cyan'
            : !dataUrlScannerUpload
              ? 'text-true-gray:80'
              : result?.text
                ? 'bg-green-500:10 text-green border-current'
                : (reading || controlling)
                  ? 'text-true-gray:80'
                  : 'bg-orange-500:10 text-orange border-current'
      "
    >
      <div
        :class="
          error
            ? 'i-ri-bug-fill'
            : loading
              ? 'i-ri-loader-4-fill animate-spin'
              : !dataUrlScannerUpload
                ? 'i-ri-qr-scan-2-line'
                : result?.text
                  ? 'i-ri-checkbox-circle-fill'
                  : (reading || controlling)
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
      <div v-else-if="!dataUrlScannerUpload">
        Upload a image to scan
      </div>
      <div v-else-if="reading || controlling" animate-pulse>
        Scanning... <span v-if="triesCount" text-xs op50>(x{{ triesCount }})</span>
      </div>
      <template v-else-if="result?.text">
        <div font-mono>
          {{ result?.text }}
        </div>
        <div flex-auto />
        <button my--2 border-0 text-sm icon-button @click="copy(result?.text)">
          <div :class="copied ? 'i-ri-check-line' : 'i-ri-clipboard-line'" />
        </button>
      </template>
      <div v-else>
        No QR code found
      </div>
    </div>

    <DefineLock v-slot="{ name }">
      <button
        flex-none text-xs icon-button
        title="Lock from randomize"
        :class="state.locks.includes(name) ? 'op75 text-yellow' : 'op40'"
        @click="toggleLock(name)"
      >
        <div :class="state.locks.includes(name) ? 'i-ri-lock-line' : 'i-ri-lock-unlock-line'" />
      </button>
    </DefineLock>

    <template v-if="dataUrlScannerUpload">
      <div border="~ base rounded" flex="~ col gap-2" p4>
        <OptionItem title="Resize" description="Resize the image's short edge" @reset="state.resize = 300">
          <OptionSlider v-model="state.resize" :min="150" :max="1000" :step="10" unit="px" />
          <ReuseLock name="resize" />
        </OptionItem>

        <div border="t base" my1 />

        <OptionItem title="Grayscale">
          <OptionCheckbox v-model="state.grayscale" />
          <div flex-auto />
          <ReuseLock name="grayscale" />
        </OptionItem>
        <OptionItem title="Contrast" @reset="state.contrast = 100">
          <OptionSlider v-model="state.contrast" :min="0" :max="1000" :default="100" :step="10" unit="%" />
          <ReuseLock name="contrast" />
        </OptionItem>
        <OptionItem title="Brightness" @reset="state.brightness = 100">
          <OptionSlider v-model="state.brightness" :min="0" :max="1000" :default="100" :step="10" unit="%" />
          <ReuseLock name="brightness" />
        </OptionItem>
        <OptionItem title="Blur">
          <OptionSlider v-model="state.blur" :min="0" :max="10" :step="0.05" unit="px" />
          <ReuseLock name="blur" />
        </OptionItem>
      </div>

      <div flex="~ gap-2 items-center wrap">
        <button
          text-sm op75 text-button hover:op100
          @click="random()"
        >
          <div i-ri-refresh-line />
          Randomize State
        </button>
        <button
          text-sm op75 text-button hover:text-yellow hover:op100
          :disabled="controlling"
          :class="controlling ? 'op50 pointer-events-none' : ''"
          @click="randomTries()"
        >
          <div i-ri-refresh-fill />
          Random Tries (x50 times)
        </button>
        <button
          v-if="result?.text"
          text-sm op75 text-button hover:text-yellow hover:op100
          :disabled="controlling"
          :class="controlling ? 'op50 pointer-events-none' : ''"
          @click="narrowDown()"
        >
          <div i-ri-align-vertically rotate-90 />
          Narrow Down
        </button>
        <div v-if="triesCount" text-xs op50>
          {{ triesCount }} tries
        </div>
        <div flex-auto />
        <button
          text-sm op75 text-button hover:text-red hover:op100
          @click="reset()"
        >
          <div i-ri-pencil-ruler-2-line />
          Default
        </button>
        <button
          text-sm op75 text-button hover:text-orange hover:op100
          @click="emptyState()"
        >
          <div i-ri-blur-off-line />
          No Preprocessing
        </button>
      </div>
    </template>

    <div flex="~ gap-3" border="~ base rounded" p4 op45 transition hover:op75>
      <span i-ri-lightbulb-line flex-none text-lg text-yellow />
      <div flex="~ col gap-4">
        <p>
          Try adjusting the preprocessing options to get the best result.
        </p>
        <p>
          This scanner uses the algorithm open sourced by WeChat, based on OpenCV.
          It uses two CNN-based models and provides much better recognizability than average scanners.
        </p>
        <p>
          The detection and decoding is done completely local in your browser.
          This is made possible by compiling OpenCV with the WeChat's scanner into WebAssembly.
          If you are interested in learning more, check out <a href="https://github.com/antfu/qr-scanner-wechat" target="_blank" font-mono op75 hover:underline hover:op100>qr-scanner-wechat</a>.
        </p>
      </div>
    </div>
    <div flex="~ gap-3" border="~ base rounded" p4 op45 transition hover:op75>
      <span i-ri-folder-2-line flex-none text-lg text-yellow />
      <div flex="~ col gap-4">
        <p>
          Have a lot images to verify? Try <a href="https://github.com/antfu/qr-verify-cli" target="_blank" font-mono op75 hover:underline hover:op100>qr-verify</a> to do so in batch!
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

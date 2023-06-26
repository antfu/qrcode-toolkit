<script setup lang="ts">
import { defaultCompareState } from '~/logic/state'
import type { ComparionState } from '~/logic/state'
import { dataUrlGeneratedSize, dataUrlQRCode, dataUrlUploadedQRCode, dataUrlUploadedImage as dataurl } from '~/logic/store'

const props = defineProps<{
  state: ComparionState
}>()

const gridSize = computed(() => props.state.gridSize < 0 ? dataUrlGeneratedSize.value : props.state.gridSize)
const gridCellSize = computed(() => 100 / gridSize.value)

// const output = ref('')
// const error = ref()
// watchEffect(() => {
//   read()
// })
// async function read() {
//   if (!dataurl.value)
//     return
//   const codeReader = new QRCodeReader()
//   try {
//     output.value = ''
//     error.value = ''

//     const image = document.createElement('img')
//     image.src = dataurl.value
//     await new Promise(resolve => image.onload = resolve)

//     const canvas = document.createElement('canvas')
//     canvas.style.width = `${image.naturalWidth}px`
//     canvas.style.height = `${image.naturalHeight}px`
//     canvas.width = image.naturalWidth
//     canvas.height = image.naturalHeight
//     canvas.getContext('2d')!.drawImage(
//       image, 0, 0, image.naturalWidth, image.naturalHeight,
//     )

//     const luminanceSource = new HTMLCanvasElementLuminanceSource(canvas)
//     const hybridBinarizer = new HybridBinarizer(luminanceSource)
//     const binaryBitmap = new BinaryBitmap(hybridBinarizer)

//     // console.log({ luminanceSource, hybridBinarizer, binaryBitmap })
//     const result = await codeReader.decode(binaryBitmap)
//     output.value = result.getText()
//   }
//   catch (err) {
//     console.error(err)
//     error.value = err
//   }
// }

function reset() {
  // eslint-disable-next-line no-alert
  if (confirm('Are you sure to reset all state?'))
    Object.assign(props.state, defaultCompareState())
}

function onQRCodeUpload(data: string) {
  dataUrlUploadedQRCode.value = data
}

const filter = computed(() => {
  const items = [
    props.state.grayscale && 'saturate(0)',
    `contrast(${props.state.contrast}%)`,
    props.state.blur && `blur(${props.state.blur}px)`,
  ]
  return items.filter(Boolean).join(' ')
})
</script>

<template>
  <div flex="~ col gap-4">
    <div v-if="dataurl" border="~ base rounded-lg" relative aspect-ratio-1 of-hidden>
      <img
        :src="dataurl"
        absolute inset-0 h-full w-full
        :style="{ filter }"
      >
      <img
        v-if="dataUrlQRCode && state.overlay"
        :src="dataUrlQRCode"
        absolute inset-0 h-full w-full
        :style="{
          filter: `blur(${state.blur}px)`,
          opacity: state.overlayOpacity,
          mixBlendMode: state.overlayBlendMode as any,
        }"
      >
      <template v-if="state.grid">
        <div
          v-for="i in gridSize"
          :key="i"
          absolute z-100
          :style="{
            left: `${(i - 1) * gridCellSize}%`,
            height: `100%`,
            border: '0.5px solid',
            borderColor: state.gridColor,
            opacity: state.gridOpacity,
          }"
        />
        <div
          v-for="i in gridSize"
          :key="i"
          absolute z-100
          :style="{
            top: `${(i - 1) * gridCellSize}%`,
            width: `100%`,
            border: '0.5px solid',
            borderColor: state.gridColor,
            opacity: state.gridOpacity,
          }"
        />
      </template>
    </div>

    <div v-if="dataurl" border="~ base rounded" flex="~ col gap-2" p4>
      <OptionItem title="Grayscale">
        <input v-model="state.grayscale" type="checkbox">
      </OptionItem>
      <OptionItem title="Contrast" @reset="state.contrast = 100">
        <OptionSlider v-model="state.contrast" :min="0" :max="300" :step="10" />
      </OptionItem>
      <OptionItem title="Blur">
        <OptionSlider v-model="state.blur" :min="0" :max="10" :step="1" />
      </OptionItem>

      <OptionItem title="Grid">
        <input v-model="state.grid" type="checkbox">
      </OptionItem>
      <OptionItem title="Grid Size" nested>
        <OptionSlider v-model="state.gridSize" :min="-1" :max="100" :step="1" />
      </OptionItem>
      <OptionItem title="Opacity" nested>
        <OptionSlider v-model="state.gridOpacity" :min="0" :max="1" :step="0.01" />
      </OptionItem>
      <OptionItem title="Color" nested>
        <div relative h-5 w-5 rounded border-none outline-none :style="{ background: state.gridColor }">
          <input v-model="state.gridColor" type="color" absolute inset-0 opacity-0.1>
        </div>
      </OptionItem>

      <OptionItem title="Overlay">
        <input v-model="state.overlay" type="checkbox">
      </OptionItem>
      <OptionItem title="Opacity" nested>
        <OptionSlider v-model="state.overlayOpacity" :min="0" :max="1" :step="0.01" />
      </OptionItem>
      <OptionItem title="Blend Mode" nested>
        <select v-model="state.overlayBlendMode" border="~ base rounded" bg-gray:10 px2 py1>
          <option value="normal">
            Normal
          </option>
          <option value="darken">
            Darken
          </option>
          <option value="lighten">
            Lighten
          </option>
          <option value="difference">
            Difference
          </option>
        </select>
      </OptionItem>
    </div>

    <div flex="~ gap-2">
      <ImageDrop title="Generated image" :data="dataurl" @data="data => dataurl = data" />
      <ImageDrop title="Original QRCode" @data="onQRCodeUpload" />
    </div>
    <!--
    <pre v-if="output" border="~ base rounded" px4 py2>{{ output }}</pre>
    <pre v-else-if="error" border="~ base rounded" bg-red:10 px4 py2 text-red>Error: {{ error }}</pre> -->

    <div>
      <button
        text-sm op75 text-button hover:text-red hover:op100
        @click="reset()"
      >
        Reset State
      </button>
    </div>
  </div>
</template>

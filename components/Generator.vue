<script setup lang="ts">
import seedrandom from 'seedrandom'
import { QrCode, QrCodeEcc, QrSegment } from '../vendor/qrcodegen'
import { dataUrlGeneratedQRCode } from '~/logic/store'
import type { QRCodeGeneratorState } from '~/logic/state'

const props = defineProps<{
  state: QRCodeGeneratorState
}>()

const canvas = ref<HTMLCanvasElement>()

// Draws the given QR Code, with the given module scale and border modules, onto the given HTML
// canvas element. The canvas's width and height is resized to (qr.size + border * 2) * scale.
// The drawn image is purely dark and light, and fully opaque.
// The scale must be a positive integer and the border must be a non-negative integer.
function drawCanvas(qr: QrCode): void {
  if (!canvas.value)
    return
  const { scale, border, lightColor, darkColor, borderNoise, borderNoiseSeed, borderNoiseRate } = props.state
  if (scale <= 0 || border < 0)
    throw new RangeError('Value out of range')
  const width: number = (qr.size + border * 2) * scale
  canvas.value.width = width
  canvas.value.height = width
  const ctx = canvas.value.getContext('2d') as CanvasRenderingContext2D

  const rng = seedrandom(String(borderNoiseSeed))

  for (let y = -border; y < qr.size + border; y++) {
    for (let x = -border; x < qr.size + border; x++) {
      const isBorder = x < 0 || y < 0 || x >= qr.size || y >= qr.size
      let isDark = false
      if (isBorder && borderNoise)
        isDark = rng() < borderNoiseRate
      else
        isDark = qr.getModule(x, y)
      ctx.fillStyle = isDark ? darkColor : lightColor

      let targetX = (x + border)
      let targetY = (y + border)

      const size = qr.size + border * 2

      if (props.state.rotate === 90) {
        targetX = size - targetX - 1
        ;[targetX, targetY] = [targetY, targetX]
      }
      else if (props.state.rotate === 180) {
        targetX = size - targetX - 1
        targetY = size - targetY - 1
      }
      else if (props.state.rotate === 270) {
        targetY = size - targetY - 1
        ;[targetX, targetY] = [targetY, targetX]
      }

      ctx.fillRect(targetX * scale, targetY * scale, scale, scale)
    }
  }
}

const eccMap = {
  L: QrCodeEcc.LOW,
  M: QrCodeEcc.MEDIUM,
  Q: QrCodeEcc.QUARTILE,
  H: QrCodeEcc.HIGH,
}

function run() {
  if (!canvas.value)
    return
  const seg = QrSegment.makeSegments(props.state.text)
  const qr = QrCode.encodeSegments(seg, eccMap[props.state.ecc], 1, 40, props.state.maskPattern, props.state.boostECC)
  drawCanvas(qr)
  dataUrlGeneratedQRCode.value = canvas.value.toDataURL()
}

function download() {
  if (!canvas.value)
    return
  const a = document.createElement('a')
  a.href = canvas.value.toDataURL()
  a.download = `${props.state.text.replace(/\W/g, '_')}[${props.state.ecc}_x${props.state.scale}].png`
  a.click()
}

function reset() {
  // eslint-disable-next-line no-alert
  if (confirm('Are you sure to reset all state?'))
    Object.assign(props.state, defaultGeneratorState())
}

watchEffect(() => {
  run()
})
</script>

<template>
  <div flex="~ prefer-row gap-2">
    <div flex="~ col gap-2" w-120>
      <textarea
        v-model="state.text"
        placeholder="Text to encode"
        border="~ base rounded"
        bg-gray:10 px4 py2
      />
      <div border="~ base rounded" flex="~ col gap-2" p4>
        <OptionItem title="Error Correction" div>
          <fieldset flex="~ gap-2">
            <label>
              <input v-model="state.ecc" type="radio" value="L">
              Low
            </label>
            <label>
              <input v-model="state.ecc" type="radio" value="M">
              Medium
            </label>
            <label>
              <input v-model="state.ecc" type="radio" value="Q">
              Quartile
            </label>
            <label>
              <input v-model="state.ecc" type="radio" value="H">
              High
            </label>
          </fieldset>
        </OptionItem>
        <OptionItem title="Scale">
          <OptionSlider v-model="state.scale" :min="1" :max="20" :step="1" />
        </OptionItem>
        <OptionItem title="Margin">
          <OptionSlider v-model="state.border" :min="0" :max="20" :step="1" />
        </OptionItem>
        <OptionItem title="Mask Pattern">
          <OptionSlider v-model="state.maskPattern" :min="-1" :max="7" :step="1" />
        </OptionItem>
        <OptionItem title="Boost ECC">
          <input v-model="state.boostECC" type="checkbox">
        </OptionItem>
        <OptionItem title="Rotate" div>
          <fieldset flex="~ gap-4">
            <label>
              <input v-model.number="state.rotate" type="radio" :value="0">
              0
            </label>
            <label>
              <input v-model.number="state.rotate" type="radio" :value="90">
              90
            </label>
            <label>
              <input v-model.number="state.rotate" type="radio" :value="180">
              180
            </label>
            <label>
              <input v-model.number="state.rotate" type="radio" :value="270">
              270
            </label>
          </fieldset>
        </OptionItem>
        <OptionItem title="Margin Noise">
          <input v-model="state.borderNoise" type="checkbox">
        </OptionItem>
        <template v-if="state.borderNoise">
          <OptionItem title="seed" nested>
            <input v-model.number="state.borderNoiseSeed" type="number" border="~ base rounded" py0.5 pl2 text-sm>
            <button
              border="~ prefer-row base rounded" bg-gray:10 p1 text-sm hover:bg-gray:20
              title="Randomize"
              @click="state.borderNoiseSeed = Math.round(Math.random() * 100000)"
            >
              <div i-ri-refresh-line />
            </button>
          </OptionItem>
          <OptionItem title="Noise Rate" nested option-item>
            <OptionSlider v-model="state.borderNoiseRate" :min="0" :max="1" :step="0.01" />
          </OptionItem>
        </template>
      </div>
      <div>
        <button
          text-sm op75 text-button hover:text-red hover:op100
          @click="reset()"
        >
          Reset State
        </button>
      </div>
    </div>
    <div flex="~ col gap-2">
      <canvas ref="canvas" w-80 width="1000" height="1000" border="~ base rounded" />
      <button
        py2 text-sm text-button
        @click="download()"
      >
        Download
      </button>
    </div>
  </div>
</template>

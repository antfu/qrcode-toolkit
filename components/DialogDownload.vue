<script setup lang="ts">
import { debounce } from 'perfect-debounce'
import { sendParentEvent } from '~/logic/messaging'
import { hasParentWindow } from '~/logic/state'
import { HightlightFactor } from '~/logic/diff'
import type { Diff, State } from '~/logic/types'

const props = defineProps<{
  modelValue: boolean
  state: State
  diff: Diff | null
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const canvas = ref<HTMLCanvasElement>()
const image = ref<HTMLImageElement>()

function close() {
  emit('update:modelValue', false)
}
watch(
  () => props.state.uploaded.image,
  async (i) => {
    if (!i)
      return
    const img = new Image()
    img.src = i
    await new Promise(resolve => img.onload = resolve)
    image.value = img
  },
  { immediate: true },
)

async function run() {
  if (!image.value || !canvas.value || !props.diff)
    return
  const c = canvas.value
  c.width = image.value.width
  c.height = image.value.height
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, c.width, c.height)
  const shortSide = Math.min(c.width, c.height)
  const dx = (c.width - shortSide) / 2
  const dy = (c.height - shortSide) / 2

  const state = props.state.compare
  const diff = props.diff

  const cellSize = shortSide / state.gridSize
  const sqrt2 = Math.sqrt(2)

  function drawPoint(x: number, y: number, type: 'square' | 'circle' = 'square') {
    if (type === 'square') {
      ctx.fillRect(
        x * cellSize + dx,
        y * cellSize + dy,
        cellSize,
        cellSize,
      )
    }
    else if (type === 'circle') {
      ctx.beginPath()
      ctx.arc(
        x * cellSize + cellSize / 2 + dx,
        y * cellSize + cellSize / 2 + dy,
        cellSize / 2 * sqrt2,
        0,
        2 * Math.PI,
      )
      ctx.fill()
    }
  }

  if (state.downloadType === 'correction') {
    if (state.downloadShowImage)
      ctx.drawImage(image.value, 0, 0)

    function getOpacity(luminance: number) {
      return Math.min(255, Math.abs(diff.darkLuminance - luminance) * HightlightFactor * state.correctionOpacity) / 255
    }

    ctx.filter = `blur(${state.correctionBlur * cellSize / 30}px)`
    if (state.correctionBlendMode !== 'none')
      ctx.globalCompositeOperation = state.correctionBlendMode

    ctx.fillStyle = '#000000'
    for (const segment of diff.mismatchLight) {
      ctx.globalAlpha = getOpacity(segment.luminance)
      drawPoint(segment.x, segment.y, state.correctionShape)
    }
    ctx.fillStyle = '#ffffff'
    for (const segment of diff.mismatchDark) {
      ctx.globalAlpha = getOpacity(segment.luminance)
      drawPoint(segment.x, segment.y, state.correctionShape)
    }
    ctx.globalAlpha = 1
  }
  else if (state.downloadType === 'mask') {
    ctx.fillStyle = state.maskColor
    for (const segment of [...diff.mismatchLight, ...diff.mismatchDark])
      drawPoint(segment.x, segment.y, state.maskShape)
  }
}

const debouncedRun = debounce(run, 100, { trailing: true })

watch(
  () => [props.state, image.value],
  () => debouncedRun(),
  { deep: true, immediate: true },
)

function download() {
  if (!canvas.value)
    return
  const a = document.createElement('a')
  a.href = canvas.value.toDataURL()
  a.download = `qrcode-output-${new Date()}.png`
  a.click()
}

function sendToInpaint() {
  if (!canvas.value)
    return
  sendParentEvent('setInpaint', canvas.value.toDataURL())
}

function sendToI2I() {
  if (!canvas.value)
    return
  sendParentEvent('setImg2img', canvas.value.toDataURL())
}

onKeyStroke('Escape', close)
</script>

<template>
  <dialog
    :open="modelValue"
    class="fixed inset-0 z-50000"
    @close="close()"
  >
    <div
      class="fixed inset-0 bg-black/20 backdrop-blur-10"
      @click="close()"
    />
    <div class="relative z-10 max-w-full w-[35rem] rounded-lg p-6 bg-base" flex="~ col gap-4" border="~ base">
      <div border="~ base rounded-lg" relative of-hidden>
        <canvas ref="canvas" w-full />
        <div absolute inset-0 z--1 class="transparent-background" />
      </div>

      <div my-2 flex="~ col gap-2" h-55>
        <div mb-2>
          <OptionSelectGroup
            v-model="state.compare.downloadType"
            :options="['correction', 'mask']"
          />
        </div>

        <template v-if="state.compare.downloadType === 'correction'">
          <OptionItem title="Include image">
            <OptionCheckbox v-model="state.compare.downloadShowImage" />
          </OptionItem>

          <OptionItem title="Correction Shape">
            <OptionSelectGroup
              v-model="state.compare.correctionShape"
              :options="['square', 'circle']"
            />
          </OptionItem>

          <SettingsCorrection :state="state.compare" />
        </template>
        <template v-else>
          <OptionItem title="Color">
            <OptionColor v-model="state.compare.maskColor" />
            <OptionSelectGroup
              v-model="state.compare.maskColor"
              :options="['#ffffff', '#000000']"
              :titles="['White', 'Black']"
            />
          </OptionItem>

          <OptionItem title="Mask shape">
            <OptionSelectGroup
              v-model="state.compare.maskShape"
              :options="['square', 'circle']"
            />
          </OptionItem>
        </template>
      </div>

      <div flex="~ gap-2">
        <template v-if="hasParentWindow">
          <template v-if="state.compare.downloadType === 'correction' && state.compare.downloadShowImage">
            <button text-sm text-button @click="sendToInpaint()">
              <div i-ri-brush-line />
              Send to inpaint
            </button>
            <button text-sm text-button @click="sendToI2I()">
              <div i-ri-image-2-line />
              Send to img2img
            </button>
          </template>
        </template>
        <div flex-auto />
        <button text-sm op75 text-button @click="close()">
          Close
        </button>

        <button text-sm text-button @click="download()">
          <div i-ri-download-line />
          Download
        </button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.transparent-background {
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAABGdBTUEAALGPC/xhBQAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAIKADAAQAAAABAAAAIAAAAACPTkDJAAAAZUlEQVRIDe2VMQoAMAgDa9/g/1/oIzrpZBCh2dLFkkoDF0Fz99OdiOjks+2/7S8fRRmMMIVoRGSoYzvvqF8ZIMKlC1GhQBc6IkPzq32QmdAzkEGihpWOSPsAss8HegYySNSw0hE9WQ4StafZFqkAAAAASUVORK5CYII=) 0% 0% / 30px;
}
</style>

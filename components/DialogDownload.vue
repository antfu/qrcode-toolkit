<script setup lang="ts">
import { debounce } from 'perfect-debounce'
import { HightlightFactor, generateMask } from '~/logic/image'
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

  const state = props.state.compare
  const diff = props.diff

  if (state.downloadShowImage)
    ctx.drawImage(image.value, 0, 0)

  const cellSize = image.value.width / state.gridSize

  function getOpacity(luminance: number) {
    return Math.min(255, Math.abs(diff.darkLuminance - luminance) * HightlightFactor * state.correctionOpacity) / 255
  }

  ctx.filter = `blur(${state.correctionBlur * cellSize / 30}px)`
  if (state.correctionBlendMode !== 'none')
    ctx.globalCompositeOperation = state.correctionBlendMode

  ctx.fillStyle = '#000000'
  for (const segment of diff.mismatchLight) {
    ctx.globalAlpha = getOpacity(segment.luminance)
    ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize, cellSize)
  }
  ctx.fillStyle = '#ffffff'
  for (const segment of diff.mismatchDark) {
    ctx.globalAlpha = getOpacity(segment.luminance)
    ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize, cellSize)
  }
  ctx.globalAlpha = 1
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

function downloadMask(type: 'mask' | 'correction') {
  if (!props.diff)
    return

  const data = generateMask(
    props.diff,
    props.state.compare,
    type,
  )

  const a = document.createElement('a')
  a.href = data
  a.download = `${type}-${new Date()}.png`
  a.click()
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
    <div class="relative z-10 max-w-full w-[35rem] rounded-lg p-4" flex="~ col gap-4" border="~ base">
      <h1 text-xl>
        Download
      </h1>
      <div border="~ base rounded-lg" relative aspect-ratio-1 of-hidden>
        <canvas ref="canvas" w-full />
        <div absolute inset-0 z--1 class="transparent-background" />
      </div>

      <OptionItem title="Include image">
        <OptionCheckbox v-model="state.compare.downloadShowImage" />
      </OptionItem>

      <OptionItem title="Correction opacity" @reset="state.compare.correctionOpacity = 1">
        <OptionSlider v-model="state.compare.correctionOpacity" :min="0" :max="2" :step="0.01" />
      </OptionItem>

      <OptionItem title="Correction Blur" @reset="state.compare.correctionBlur = 0">
        <OptionSlider v-model="state.compare.correctionBlur" :min="0" :max="20" :step="0.05" />
      </OptionItem>

      <OptionItem title="Correction Blend">
        <OptionSelectGroup
          v-model="state.compare.correctionBlendMode"
          :options="['none', 'overlay', 'darken', 'lighten', 'difference']"
        />
      </OptionItem>

      <div flex="~ gap-2" mt-5>
        <button
          w-48 text-sm text-button
          @click="downloadMask('mask')"
        >
          <div i-ri-download-line />
          Download Mask
        </button>
        <div />
        <button px5 op75 text-button @click="close()">
          Close
        </button>
        <button w-35 text-button @click="download()">
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

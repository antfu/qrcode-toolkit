<script setup lang="ts">
import { debounce } from 'perfect-debounce'
import { generateQRCode } from '~/logic/generate'
import { dataUrlGeneratedQRCode, defaultGeneratorState, qrcode } from '~/logic/state'
import type { State } from '~/logic/types'

const props = defineProps<{
  state: State
}>()

const state = computed(() => props.state.qrcode)

const canvas = ref<HTMLCanvasElement>()

function run() {
  if (!canvas.value)
    return
  generateQRCode(canvas.value, state.value)
  dataUrlGeneratedQRCode.value = canvas.value.toDataURL()
}

function download() {
  if (!canvas.value)
    return
  const a = document.createElement('a')
  a.href = dataUrlGeneratedQRCode.value!
  a.download = `${state.value.text.replace(/\W/g, '_')}[${state.value.ecc}_x${state.value.scale}].png`
  a.click()
}

function reset() {
  // eslint-disable-next-line no-alert
  if (confirm('Are you sure to reset all state?'))
    Object.assign(state.value, defaultGeneratorState())
}

const debouncedRun = debounce(run, 100, { trailing: true })

watch(
  () => state.value,
  () => debouncedRun(),
  { deep: true, immediate: true },
)
</script>

<template>
  <div grid="~ cols-[40rem_1fr] gap-2">
    <div flex="~ col gap-2">
      <textarea
        v-model="state.text"
        placeholder="Text to encode"
        border="~ base rounded"
        bg-secondary px4 py2
      />
      <div border="~ base rounded" flex="~ col gap-2" p4>
        <OptionItem title="Error Correction" div>
          <OptionSelectGroup
            v-model="state.ecc"
            :options="['L', 'M', 'Q', 'H']"
          />
        </OptionItem>
        <OptionItem title="Boost ECC" nested>
          <OptionCheckbox v-model="state.boostECC" />
        </OptionItem>

        <OptionItem title="Mask Pattern">
          <OptionSlider v-model="state.maskPattern" :min="-1" :max="7" :step="1" />
        </OptionItem>

        <OptionItem title="Rotate" div>
          <OptionSelectGroup
            v-model="state.rotate"
            :options="[0, 90, 180, 270]"
          />
        </OptionItem>

        <OptionItem title="Style" />

        <OptionItem title="Pixel" nested>
          <OptionSelectGroup
            v-model="state.pixelStyle"
            :options="['square', 'dot', 'squircle', 'rounded', 'mixed']"
          />
        </OptionItem>

        <OptionItem title="Marker" nested>
          <OptionSelectGroup
            v-model="state.markerStyle"
            :options="['auto', 'square', 'dot', 'squircle', 'rounded', 'mixed']"
          />
        </OptionItem>

        <OptionItem title="Marker Shape" nested>
          <OptionSelectGroup
            v-model="state.markerShape"
            :options="['square', 'circle', 'plus', 'box']"
          />
        </OptionItem>

        <div border="t base" my1 />

        <OptionItem title="Margin">
          <OptionSlider v-model="state.margin" :min="0" :max="20" :step="1" />
        </OptionItem>
        <OptionItem title="Margin Noise">
          <OptionCheckbox v-model="state.marginNoise" />
        </OptionItem>
        <template v-if="state.marginNoise">
          <OptionItem title="Seed" nested>
            <input
              v-model.number="state.marginNoiseSeed" type="number"
              border="~ base rounded"
              bg-secondary py0.5 pl2 text-sm
            >
            <button
              text-sm icon-button
              title="Randomize"
              @click="state.marginNoiseSeed = Math.round(Math.random() * 100000)"
            >
              <div i-ri-refresh-line />
            </button>
          </OptionItem>
          <OptionItem title="Noise Rate" nested option-item>
            <OptionSlider v-model="state.marginNoiseRate" :min="0" :max="1" :step="0.01" />
          </OptionItem>
        </template>

        <div border="t base" my1 />

        <OptionItem title="Min Version">
          <OptionSlider v-model="state.minVersion" :min="1" :max="state.maxVersion" :step="1" />
        </OptionItem>

        <OptionItem title="Max Version">
          <OptionSlider v-model="state.maxVersion" :min="state.minVersion" :max="40" :step="1" />
        </OptionItem>

        <OptionItem title="Scale">
          <OptionSlider v-model="state.scale" :min="1" :max="30" :step="1" />
        </OptionItem>
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
      <canvas ref="canvas" w-full width="1000" height="1000" border="~ base rounded" />

      <div v-if="qrcode" border="~ base rounded" grid="~ gap-1 cols-6 items-center" p1 pl6 pr0>
        <div text-sm op50>
          Size
        </div>
        <div>
          {{ qrcode.size }}
        </div>
        <div text-sm op50>
          Mask
        </div>
        <div>
          {{ qrcode.mask }}
        </div>
        <div text-sm op50>
          Version
        </div>
        <div>
          {{ qrcode.version }}
        </div>
      </div>
      <button
        py2 text-sm text-button
        @click="download()"
      >
        Download
      </button>
    </div>
  </div>
</template>

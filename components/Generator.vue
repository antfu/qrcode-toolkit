<script setup lang="ts">
import { debounce } from 'perfect-debounce'
import { sendParentEvent } from '~/logic/messaging'
import { generateQRCode } from '~/logic/generate'
import { dataUrlGeneratedQRCode, defaultGeneratorState, generateQRCodeInfo, hasParentWindow, qrcode, view } from '~/logic/state'
import type { State } from '~/logic/types'
import { MarkerInnerShapeIcons, MarkerInnerShapes, MarkerShapeIcons, MarkerShapes, PixelStyleIcons, PixelStyles } from '~/logic/types'
import { getAspectRatio } from '~/logic/utils'

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

const debouncedRun = debounce(run, 250, { trailing: true })

const mayNotScannable = computed(() => {
  if (state.value.marginNoise && state.value.marginNoiseSpace === 'none')
    return true
  if (state.value.effect === 'crystalize' && state.value.effectCrystalizeRadius / state.value.scale > 0.4)
    return true
})

function sendCompare() {
  props.state.uploaded.qrcode = dataUrlGeneratedQRCode.value!
  view.value = 'compare'
}

function sendToWebUI() {
  sendParentEvent('setControlNet', dataUrlGeneratedQRCode.value!)
}

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
          <OptionSelectGroup
            v-model="state.maskPattern"
            :options="[-1, 0, 1, 2, 3, 4, 5, 6, 7]"
            :titles="['Auto']"
          />
        </OptionItem>

        <OptionItem title="Rotate" div>
          <OptionSelectGroup
            v-model="state.rotate"
            :options="[0, 90, 180, 270]"
            :titles="['0°', '90°', '180°', '270°']"
          />
        </OptionItem>

        <OptionItem title="Style" />

        <OptionItem title="Pixel" nested>
          <OptionSelectGroup
            v-model="state.pixelStyle"
            :options="PixelStyles"
            :classes="PixelStyleIcons"
          />
        </OptionItem>

        <OptionItem title="Marker" nested>
          <OptionSelectGroup
            v-if="state.markerShape !== 'circle'"
            v-model="state.markerStyle"
            :options="state.markerShape === 'octagon' ? PixelStyles.slice(0, 2) : PixelStyles"
            :classes="state.markerShape === 'octagon' ? PixelStyleIcons.slice(0, 2) : PixelStyleIcons"
          />
          <OptionSelectGroup
            v-model="state.markerStyle"
            :options="['auto']"
          />
        </OptionItem>

        <OptionItem title="Marker Shape" nested>
          <OptionSelectGroup
            v-model="state.markerShape"
            :options="MarkerShapes"
            :classes="MarkerShapeIcons"
          />
        </OptionItem>

        <OptionItem title="Inner Marker" nested>
          <OptionSelectGroup
            v-model="state.markerInnerShape"
            :options="MarkerInnerShapes"
            :classes="MarkerInnerShapeIcons"
          />
          <OptionSelectGroup
            v-model="state.markerInnerShape"
            :options="['auto']"
          />
        </OptionItem>

        <OptionItem title="Invert">
          <OptionCheckbox v-model="state.invert" />
        </OptionItem>

        <OptionItem title="Seed">
          <input
            v-model.number="state.seed" type="number"
            border="~ base rounded"
            bg-secondary py0.5 pl2 text-sm
          >
          <button
            text-sm icon-button
            title="Randomize"
            @click="state.seed = Math.round(Math.random() * 100000)"
          >
            <div i-ri-refresh-line />
          </button>
        </OptionItem>

        <div border="t base" my1 />
        <SettingsMargin v-model="state.margin" />

        <OptionItem title="Margin Noise">
          <OptionCheckbox v-model="state.marginNoise" />
        </OptionItem>
        <template v-if="state.marginNoise">
          <OptionItem title="Noise Rate" nested option-item>
            <OptionSlider v-model="state.marginNoiseRate" :min="0" :max="1" :step="0.01" />
          </OptionItem>
          <OptionItem title="Safe Space" nested option-item>
            <OptionSelectGroup
              v-model="state.marginNoiseSpace"
              :options="['none', 'marker', 'full']"
              :titles="['None', 'Around markers', 'Full']"
            />
          </OptionItem>
        </template>

        <div border="t base" my1 />

        <OptionItem title="Min Version">
          <OptionSlider v-model="state.minVersion" :min="1" :max="state.maxVersion" :step="1" />
        </OptionItem>

        <OptionItem title="Max Version">
          <OptionSlider v-model="state.maxVersion" :min="state.minVersion" :max="40" :step="1" />
        </OptionItem>

        <OptionItem title="Pixel Size">
          <OptionSlider v-model="state.scale" :min="1" :max="50" :step="1" />
        </OptionItem>

        <div border="t base" my1 />

        <OptionItem title="Effect">
          <OptionSelectGroup
            v-model="state.effect"
            :options="['none', 'crystalize']"
          />
        </OptionItem>

        <template v-if="state.effect === 'crystalize'">
          <OptionItem title="Radius" nested>
            <OptionSlider v-model="state.effectCrystalizeRadius" :min="1" :max="20" :step="0.5" />
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
      <canvas ref="canvas" w-full width="1000" height="1000" border="~ base rounded" />

      <div v-if="qrcode" border="~ base rounded" p3 pl6 pr0 flex="~ col gap-2">
        <div grid="~ gap-1 cols-6 items-center">
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
        <div v-if="generateQRCodeInfo" grid="~ gap-1 cols-[1.5fr_2fr_1fr_1.5fr] items-center">
          <div text-sm op50>
            Dimension
          </div>
          <div text-sm>
            {{ generateQRCodeInfo.width }} x {{ generateQRCodeInfo.height }}
          </div>
          <div text-sm op50>
            Aspect
          </div>
          <div text-sm>
            {{ getAspectRatio(generateQRCodeInfo.width, generateQRCodeInfo.height) }}
          </div>
        </div>
      </div>
      <button
        py2 text-sm text-button
        @click="download()"
      >
        <div i-ri-download-line />
        Download
      </button>
      <button
        py2 text-sm text-button
        @click="sendCompare()"
      >
        <div i-ri-compasses-2-line />
        Send to Compare
      </button>
      <button
        v-if="hasParentWindow"
        py2 text-sm text-button
        @click="sendToWebUI()"
      >
        <div i-ri-file-upload-line />
        Send to ControlNet
      </button>
      <div v-if="mayNotScannable" border="~ amber-6/60 rounded" bg-amber-5:10 px4 py3 text-sm text-amber-6>
        This QR Code may or may not be scannable. Please verify before using.
      </div>
    </div>
  </div>
</template>

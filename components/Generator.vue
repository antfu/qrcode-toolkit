<script setup lang="ts">
import { debounce } from 'perfect-debounce'
import { sendParentEvent } from '~/logic/messaging'
import { generateQRCode } from '~/logic/generate'
import { dataUrlGeneratedQRCode, defaultGeneratorState, generateQRCodeInfo, hasParentWindow, isLargeScreen, qrcode } from '~/logic/state'
import { view } from '~/logic/view'
import type { State } from '~/logic/types'
import { MarkerSubShapeIcons, MarkerSubShapes, PixelStyleIcons, PixelStyles } from '~/logic/types'
import { getAspectRatio, sendQRCodeToCompare } from '~/logic/utils'

const props = defineProps<{
  state: State
}>()

const rightPanelEl = ref<HTMLElement>()
const uploadTarget = ref<'image' | 'qrcode'>()
const state = computed(() => props.state.qrcode)
const rightPanelRect = reactive(useElementBounding(rightPanelEl))
const floating = computed(() => rightPanelRect.top < 10 && isLargeScreen.value)

const canvas = ref<HTMLCanvasElement>()

async function run() {
  if (!canvas.value)
    return
  await generateQRCode(canvas.value, state.value)
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

function downloadState() {
  const data = {
    '//': 'Generator state of Anthony\'s QR Toolkit https://qrcode.antfu.me/',
    ...state.value,
  }

  const text = JSON.stringify(data, null, 2)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  a.download = `qr-options-${state.value.text.replace(/\W/g, '_')}.json`
  a.click()
}

async function readState(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file)
    return

  const reader = new FileReader()
  const promise = new Promise<string>((resolve, reject) => {
    reader.onload = () => {
      resolve(reader.result as any)
    }
    reader.onerror = reject
  })
  reader.readAsText(file)
  const text = await promise
  try {
    const data = JSON.parse(text)
    // eslint-disable-next-line no-alert
    if (confirm('Are you sure to override the state with file uploaded?')) {
      const keys = Object.keys(state.value)
      for (const key of keys) {
        if (key in data)
          // @ts-expect-error anyway
          state.value[key] = data[key]
      }
    }
  }
  catch (e) {
    // eslint-disable-next-line no-alert
    alert('Invalid JSON file')
  }
}

const debouncedRun = debounce(run, 250, { trailing: true })

const mayNotScannable = computed(() => {
  if ((state.value.marginNoise || state.value.backgroundImage) && state.value.marginNoiseSpace === 'none')
    return true
  if (state.value.effect === 'crystalize' && state.value.effectCrystalizeRadius / state.value.scale > 0.4)
    return true
  if (
    state.value.effect === 'liquidify'
    && (
      (state.value.effectLiquidifyRadius / state.value.scale > 0.4)
      || (Math.abs(state.value.effectLiquidifyThreshold - 128) > 32)
    )
  )
    return true
  if (state.value.markerShape === 'tiny-plus')
    return true
  if (!['square', 'circle', 'box'].includes(state.value.markerSub))
    return true
  if (Math.abs(state.value.transformPerspectiveX) > 0.1 || Math.abs(state.value.transformPerspectiveY) > 0.1)
    return true
  if (state.value.transformScale > 1.05)
    return true
})

const hasNonCenteredMargin = computed(() => {
  if (typeof state.value.margin === 'number')
    return false
  return state.value.margin.top !== state.value.margin.bottom
    || state.value.margin.left !== state.value.margin.right
})

function sendCompare() {
  sendQRCodeToCompare(props.state)
  view.value = 'compare'
}

function sendToWebUI() {
  sendParentEvent('setControlNet', dataUrlGeneratedQRCode.value!)
}

function toggleMarkerStyleExpand() {
  if (!props.state.qrcode.markers?.length) {
    props.state.qrcode.markers = [
      {
        markerShape: props.state.qrcode.markerShape,
        markerStyle: props.state.qrcode.markerStyle,
        markerInnerShape: props.state.qrcode.markerInnerShape,
      },
      {
        markerShape: props.state.qrcode.markerShape,
        markerStyle: props.state.qrcode.markerStyle,
        markerInnerShape: props.state.qrcode.markerInnerShape,
      },
    ]
  }
  else {
    props.state.qrcode.markers = []
  }
}

const uploadQR = ref<string>()

const { isOverDropZone } = useDropZone(document.body, {
  onDrop(files) {
    if (view.value !== 'generator')
      return
    if (!files || !uploadTarget.value)
      return

    const file = files[0]
    if (file.type === 'image/png' || file.type === 'image/jpeg') {
      const reader = new FileReader()
      reader.onload = () => {
        const data = reader.result as string
        if (uploadTarget.value === 'qrcode')
          uploadQR.value = data
      }
      reader.readAsDataURL(file)
    }
  },
  onLeave() {
    uploadTarget.value = undefined
  },
  onOver(_, event) {
    if (uploadQR.value)
      uploadQR.value = undefined
    if (view.value !== 'generator')
      return
    if (!isOverDropZone.value)
      return

    const chain = Array.from(document.elementsFromPoint(event.clientX, event.clientY))
    if (chain.find(el => el.id === 'upload-zone-qrcode'))
      uploadTarget.value = 'qrcode'
    else
      uploadTarget.value = undefined
  },
})

watch(
  () => state.value,
  () => debouncedRun(),
  { deep: true, immediate: true },
)
</script>

<template>
  <div grid="~ cols-[38rem_1fr] gap-2" lt-lg="flex flex-col-reverse">
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
          <label flex="~ gap-2 items-center" ml2>
            <OptionCheckbox v-model="state.boostECC" />
            <span text-sm op75>Boost ECC</span>
          </label>
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

        <div border="t base" my1 />

        <OptionItem title="Pixel Style">
          <OptionSelectGroup
            v-model="state.pixelStyle"
            :options="PixelStyles"
            :classes="PixelStyleIcons"
          />
        </OptionItem>

        <OptionItem :title="state.markers.length ? 'Marker 1' : 'Markers'">
          <div flex-auto />
          <button
            icon-button-sm
            title="Toggle Expand"
            @click="toggleMarkerStyleExpand"
          >
            <div :class="state.markers.length ? 'i-ri-arrow-up-s-line' : 'i-ri-arrow-down-s-line'" />
          </button>
        </OptionItem>

        <template v-if="!state.markers.length">
          <SettingsMarkerStyle :state="state" nested number="Marker" />
        </template>
        <template v-else>
          <SettingsMarkerStyle :state="state" nested />
          <OptionItem title="Marker 2" />
          <SettingsMarkerStyle :state="state.markers[0]" nested />
          <OptionItem title="Marker 3" />
          <SettingsMarkerStyle :state="state.markers[1]" nested />
          <div border="t base" my1 />
        </template>

        <OptionItem v-if="qrcode?.version !== 1" title="Sub Markers">
          <OptionSelectGroup
            v-model="state.markerSub"
            :options="MarkerSubShapes"
            :classes="MarkerSubShapeIcons"
          />
        </OptionItem>

        <div border="t base" my1 />

        <SettingsMargin
          v-model="state.margin"
          :full-customizable="true"
        />

        <OptionItem title="Margin Noise" description="Add some random data points to the margin">
          <OptionCheckbox v-model="state.marginNoise" />
        </OptionItem>

        <template v-if="state.marginNoise">
          <OptionItem title="Noise Rate" nested description="Percentage of whether a black point should be placed">
            <OptionSlider v-model="state.marginNoiseRate" :min="0" :max="1" :step="0.01" />
          </OptionItem>

          <SettingsRandomRange
            v-model="state.marginNoiseOpacity"
            title="Opacity"
            nested
            :min="0"
            :max="1"
            :step="0.01"
          />
        </template>
        <OptionItem title="Safe Space">
          <OptionSelectGroup
            v-model="state.marginNoiseSpace"
            :options="['full', 'marker', 'minimal', 'extreme', 'none']"
          />
        </OptionItem>
        <OptionItem title="Render Type">
          <OptionSelectGroup
            v-model="state.renderPointsType"
            :options="['all', 'function', 'data', 'guide', 'marker']"
          />
        </OptionItem>
        <OptionItem title="Seed">
          <input
            v-model.number="state.seed" type="number"
            border="~ base rounded"
            bg-secondary py0.5 pl2 text-sm
          >
          <button
            p1 icon-button-sm
            title="Randomize"
            @click="state.seed = Math.round(Math.random() * 100000)"
          >
            <div i-ri-refresh-line />
          </button>
        </OptionItem>
        <OptionItem title="Background" div>
          <OptionColor v-if="state.backgroundImage?.startsWith('#')" v-model="state.backgroundImage" />
          <button v-else relative text-xs text-button>
            <img
              v-if="state.backgroundImage" :src="state.backgroundImage"
              absolute inset-0 z-0 h-full w-full rounded object-cover op50
            >
            <div i-ri-upload-line z-1 />
            <div z-1>
              Upload
            </div>
            <ImageUpload v-model="state.backgroundImage" />
          </button>
          <button v-if="state.backgroundImage" icon-button-sm title="Clear">
            <div i-carbon-close @click="state.backgroundImage = undefined" />
          </button>
          <div flex-auto />
          <button v-if="!state.backgroundImage" icon-button-sm title="Switch to Color">
            <div i-ri-paint-fill @click="state.backgroundImage = '#888888'" />
          </button>
        </OptionItem>

        <div border="t base" my1 />

        <OptionItem title="Colors" div @reset="() => { state.lightColor = '#ffffff'; state.darkColor = '#000000' }">
          <div flex="~ gap-2">
            <OptionColor v-model="state.lightColor" />
            <OptionColor v-model="state.darkColor" />
            <label flex="~ gap-2 items-center" ml2>
              <OptionCheckbox v-model="state.invert" />
              <span text-sm op75>Invert</span>
            </label>
          </div>
        </OptionItem>

        <div border="t base" my1 />

        <OptionItem title="Min Version">
          <OptionSlider v-model="state.minVersion" :min="1" :max="state.maxVersion" :step="1" />
        </OptionItem>

        <OptionItem title="Max Version">
          <OptionSlider v-model="state.maxVersion" :min="state.minVersion" :max="40" :step="1" />
        </OptionItem>

        <OptionItem title="Pixel Size">
          <OptionSlider v-model="state.scale" :min="1" :max="50" :step="1" unit="px" />
        </OptionItem>

        <div border="t base" my1 />

        <OptionItem title="Effect">
          <OptionSelectGroup
            v-model="state.effect"
            :options="['none', 'crystalize', 'liquidify']"
          />
        </OptionItem>

        <template v-if="state.effect === 'crystalize'">
          <OptionItem title="Radius" nested>
            <OptionSlider v-model="state.effectCrystalizeRadius" :min="1" :max="20" :step="0.5" />
          </OptionItem>
        </template>
        <template v-if="state.effect === 'liquidify'">
          <OptionItem title="Distort Radius" nested>
            <OptionSlider v-model="state.effectLiquidifyDistortRadius" :min="1" :max="40" :step="1" />
          </OptionItem>
          <OptionItem title="Blur Radius" nested>
            <OptionSlider v-model="state.effectLiquidifyRadius" :min="1" :max="40" :step="1" />
          </OptionItem>
          <OptionItem title="Threshold" nested @reset="state.effectLiquidifyThreshold = 128">
            <OptionSlider v-model="state.effectLiquidifyThreshold" :min="1" :max="254" :step="1" unit="/256" />
          </OptionItem>
        </template>

        <template v-if="state.effect !== 'none'">
          <OptionItem title="Effect Timing">
            <OptionSelectGroup
              v-model="state.effectTiming"
              :options="['before', 'after']"
            />
          </OptionItem>
        </template>

        <div border="t base" my1 />

        <OptionItem title="Transform" />
        <OptionItem title="Perspective X" nested @reset="state.transformPerspectiveX = 0">
          <OptionSlider v-model="state.transformPerspectiveX" :min="-0.5" :max="0.5" :step="0.01" :default="0" />
        </OptionItem>
        <OptionItem title="Perspective Y" nested @reset="state.transformPerspectiveY = 0">
          <OptionSlider v-model="state.transformPerspectiveY" :min="-0.5" :max="0.5" :step="0.01" :default="0" />
        </OptionItem>
        <OptionItem title="Scale" nested @reset="state.transformScale = 1">
          <OptionSlider v-model="state.transformScale" :min="0.5" :max="2" :step="0.01" :default="1" />
        </OptionItem>
      </div>
      <div flex="~ gap-2">
        <button
          text-sm op75 text-button hover:op100
          @click="downloadState()"
        >
          <div i-ri-download-2-line />
          Save state
        </button>
        <button

          relative text-sm op75 text-button hover:op100
        >
          <div i-ri-upload-2-line />
          Load state
          <input
            type="file" accept="application/json"
            absolute bottom-0 left-0 right-0 top-0 z-10
            max-h-full max-w-full cursor-pointer opacity-0.1
            @input="readState"
          >
        </button>
        <div flex-auto />
        <button
          text-sm op75 text-button hover:text-red hover:op100
          @click="reset()"
        >
          <div i-ri-delete-bin-6-line />
          Reset State
        </button>
      </div>
    </div>
    <div ref="rightPanelEl">
      <div
        flex="~ col gap-2"
        :style="floating ? {
          position: 'fixed',
          top: '10px',
          left: `${rightPanelRect.left}px`,
          width: `${rightPanelRect.width}px`,
        } : {}"
      >
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
              {{ qrcode.maskPattern }}
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
          <div i-ri-send-backward />
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
        <div v-if="mayNotScannable" border="~ amber-6/60 rounded" bg-amber-5:10 px3 py2 text-sm text-amber-6>
          This QR Code may or may not be scannable. Please verify before using.
        </div>
        <div v-if="hasNonCenteredMargin" border="~ yellow-6/60 rounded" bg-yellow-5:10 px3 py2 text-sm text-yellow-6>
          The <b>compare tab</b> does not support non-centered QR Code yet. If you generated with this QR Code, you'll need to verify the result manually.
        </div>
        <div v-if="state.transformPerspectiveX !== 0 || state.transformPerspectiveY !== 0 || state.transformScale !== 1" border="~ yellow-6/60 rounded" bg-yellow-5:10 px3 py2 text-sm text-yellow-6>
          The <b>compare tab</b> does not support transformations. If you generated with this QR Code, you'll need to verify the result manually.
        </div>
        <div v-if="state.renderPointsType !== 'all'" border="~ indigo/60 rounded" bg-indigo-5:10 px3 py2 text-sm text-indigo>
          This is a partial QR Code. It does <b>not</b> contain all the necessary data to be scannable.
        </div>
      </div>

      <div my8 h-1px border="t base" w-10 lg:hidden />
    </div>
  </div>

  <div v-if="isOverDropZone" fixed bottom-0 left-0 right-0 top-0 z-200 flex bg-black:20 backdrop-blur-10>
    <div
      id="upload-zone-qrcode" flex="~ col gap-3 items-center justify-center" m10 ml-1 w-full op40
      :class="uploadTarget === 'qrcode' ? 'bg-gray:20 op100 border-base' : ''"
      border="3 dashed transparent rounded-xl"
    >
      <div i-carbon-qr-code text-20 />
      <div text-xl>
        Scan QR Code
      </div>
    </div>
  </div>

  <DialogScan
    v-if="uploadQR"
    :model-value="true"
    :qrcode="uploadQR"
    :state="props.state"
    @update:model-value="uploadQR = undefined"
  />
</template>

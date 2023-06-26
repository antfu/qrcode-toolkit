<script setup lang="ts">
import { state } from '~/logic/store'

const view = useLocalStorage<'generator' | 'compare'>('qrd-tab', 'generator')
</script>

<template>
  <div p10 py-15 flex="~ justify-center">
    <div w-210 flex="~ col gap-2">
      <div flex="~ gap-2">
        <button
          flex="~ gap-1.5 items-center" text-button
          :class="view === 'generator' ? 'bg-gray:20' : 'op50'"
          @click="view = 'generator'"
        >
          <div i-ri-qr-code-line />
          Generator
        </button>
        <button
          flex="~ gap-1.5 items-center" text-button
          :class="view === 'compare' ? 'bg-gray:20' : 'op50'"
          @click="view = 'compare'"
        >
          <div i-ri-compasses-2-line />
          Compare
        </button>
      </div>

      <div my4 h-1px w-10 border-t border-base />

      <div v-show="view === 'generator'">
        <Generator :state="state.qrcode" />
      </div>
      <div v-show="view === 'compare'">
        <Compare :state="state.compare" />
      </div>

      <div my4 h-1px w-10 border-t border-base />

      <div py2>
        <span op50>Anthony's</span> <span op75>QR Code</span> <span op90>Debugger</span>
      </div>
    </div>
  </div>
</template>

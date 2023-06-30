<script setup lang="ts">
import { storeIndex } from '~/logic/state'

const view = useLocalStorage<'generator' | 'compare'>('qrd-tab', 'generator')
</script>

<template>
  <div flex px20 py50 text-center op50 md:hidden>
    This app is not supported on mobile devices. Please try with a bigger screen.
  </div>
  <div flex="justify-center" hidden p10 md:flex>
    <div w-250 flex="~ col gap-4">
      <div flex="~ gap-2">
        <button
          flex="~ gap-1.5 items-center" text-button
          :class="view === 'generator' ? 'bg-secondary' : 'op50'"
          @click="view = 'generator'"
        >
          <div i-ri-qr-code-line />
          Generator
        </button>
        <button
          flex="~ gap-1.5 items-center" text-button
          :class="view === 'compare' ? 'bg-secondary' : 'op50'"
          @click="view = 'compare'"
        >
          <div i-ri-compasses-2-line />
          Compare
        </button>
        <div flex-auto />
      </div>

      <div fixed right-5 top-14 flex="col gap-2" hidden xl:flex>
        <VTooltip v-for="n in 10" :key="n" placement="left" distance="10">
          <button
            :style="{
              opacity: storeIndex === n ? 1 : 1 - (Math.abs(storeIndex - n) + 2) * 0.18,
              transform: storeIndex === n ? 'scale(1.1)' : 'scale(0.95)',
            }"
            class="hover:op100!"
            h-8 w-8 transition-all duration-300 icon-button @click="storeIndex = n"
          >
            {{ n }}
          </button>
          <template #popper>
            <div text-sm>
              Save slot {{ n }}
            </div>
          </template>
        </VTooltip>
      </div>

      <StateProvider :key="storeIndex" :index="storeIndex" :view="view" />

      <div mt-10>
        <span op55>Anthony's</span> <span op75>QR Code</span> <span op50>Toolkit</span><br>
        <span op35>Made with </span> <a mt--1 href="https://nuxt.com" target="_blank" flex="~ inline gap-1 items-center" translate-y-0.9 op75 hover:op100><div i-logos-nuxt-icon /> <span font-bold op65>Nuxt</span></a><br>
        <br>
        <span op45>Built for marking</span> <a href="https://antfu.me/posts/ai-qrcode" target="_blank" op50 hover:op100>AI blended QR Code</a><br>
        <a op75 hover:op100 href="https://antfu.me/posts/ai-qrcode-refine" target="_blank">Learn more</a>
      </div>
      <div flex="~ gap-2">
        <a href="https://github.com/antfu/qrcode-toolkit" target="_blank" text-lg op50 hover:op100>
          <div i-ri-github-fill />
        </a>
        <a href="https://antfu.me" target="_blank" text-lg op50 hover:op100>
          <img src="https://antfu.me/favicon.svg" h-1.2em w-1.2em>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  meta: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1.0',
    },
  ],
  link: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: '/favicon.svg',
    },
  ],
})

useSeoMeta({
  title: 'Anthony\'s QR Toolkit',
})
</script>

<template>
  <NuxtPage />
</template>

<style>
html, body , #__nuxt {
  height: 100vh;
  margin: 0;
  padding: 0;
  color: #222;
  accent-color: #888;
  background: white;
  color-scheme: light;
}

html.dark,
.dark body,
.dark #__nuxt {
  background: black !important;
  color: white !important;
  color-scheme: dark;
}

/* Overrides Floating Vue */
.v-popper--theme-dropdown .v-popper__inner,
.v-popper--theme-tooltip .v-popper__inner {
  --at-apply: bg-black text-white rounded border border-base shadow;
  box-shadow: 0 6px 30px #0000001a;
}

.v-popper--theme-tooltip .v-popper__arrow-inner,
.v-popper--theme-dropdown .v-popper__arrow-inner {
  visibility: visible;
  --at-apply: border-black;
}

.v-popper--theme-tooltip .v-popper__arrow-outer,
.v-popper--theme-dropdown .v-popper__arrow-outer {
  --at-apply: border-base;
}

.v-popper--theme-tooltip.v-popper--shown,
.v-popper--theme-tooltip.v-popper--shown * {
  transition: none !important;
}
</style>

export default defineNuxtConfig({
  modules: [
    '@vueuse/nuxt',
    '@unocss/nuxt',
    '@nuxtjs/color-mode',
    'floating-vue/nuxt',
  ],

  ssr: false,

  experimental: {
    payloadExtraction: false,
    inlineSSRStyles: false,
    renderJsonPayloads: true,
    typedPages: true,
  },

  nitro: {
    routeRules: {
      '/*': {
        cors: true,
      },
    },
  },

  spaLoadingTemplate: false,

  vite: {
    vue: {
      script: {
        defineModel: true,
      },
    },
    server: {
      cors: true,
    },
  },

  imports: {
    dirs: [],
  },

  css: [
    '@unocss/reset/tailwind.css',
  ],

  devtools: {
    enabled: true,
    experimental: {
      timeline: true,
    },
  },
})

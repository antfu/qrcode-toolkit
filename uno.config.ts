import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  shortcuts: [
    {
      'bg-base': 'bg-white dark:bg-black',
      'bg-secondary': 'bg-gray:10',
      'bg-active': 'bg-gray:15',
      'border-base': 'border-#303030',
      'flex-prefer-row': 'flex flex-col md:flex-row',
      'flex-prefer-col': 'flex flex-col md:flex-row',
      'border-box': 'border border-base rounded',
      'text-button': 'border-box bg-secondary hover:bg-active px3 py1 flex gap-1 items-center justify-center',
      'icon-button': 'border-box bg-secondary hover:bg-active p1',
    },
  ],
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
    }),
    presetTypography(),
    presetWebFonts({
      fonts: {
        sans: 'DM Sans',
        serif: 'DM Serif Display',
        mono: 'DM Mono',
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})

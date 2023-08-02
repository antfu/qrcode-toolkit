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
import { FileSystemIconLoader } from '@iconify/utils/lib/loader/node-loaders'

export default defineConfig({
  shortcuts: [
    {
      'bg-base': 'bg-white dark:bg-black',
      'bg-secondary': 'bg-gray:10',
      'bg-active': 'bg-gray:15',
      'border-base': 'border-#aaa3',
      'border-box': 'border border-base rounded',
      'text-button': 'border-box bg-secondary hover:bg-active px3 py1 flex gap-1 items-center justify-center',
      'icon-button': 'border-box bg-secondary hover:bg-active p1',
      'icon-button-sm': 'icon-button p0.5 text-sm',
    },
  ],
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      collections: {
        custom: FileSystemIconLoader('./icons', svg => svg.replace('black', 'currentColor')),
      },
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

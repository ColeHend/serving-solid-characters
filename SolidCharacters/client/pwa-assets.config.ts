import { defineConfig, minimalPreset as preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset,
  images: [
    "public/icons/pwa-64x64.png",
    "public/icons/pwa-192x192.png",
    "public/icons/pwa-512x512.png",
    "public/icons/apple-touch-icon-180x180.png",
    "public/icons/maskable-icon-512x512.png",
    "public/arcane_dictionary_sq.png"
  ]
})
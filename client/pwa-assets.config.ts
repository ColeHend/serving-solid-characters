import { defineConfig, minimalPreset as preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset,
  images: [
    "public/icons/icon-64x64.png",
    "public/icons/icon-96x96.png",
    "public/icons/icon-128x128.png",
    "public/icons/icon-144x144.png",
    "public/icons/icon-152x152.png",
    "public/icons/icon-192x192.png",
    "public/icons/icon-384x384.png",
    "public/icons/icon-512x512.png",
    "public/icons/icon512_maskable.png",
    "public/icons/icon-180x180.png"
  ]
})
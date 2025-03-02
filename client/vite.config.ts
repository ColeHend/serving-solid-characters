import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { ManifestOptions, PWAIntegration, VitePWA, VitePWAOptions } from 'vite-plugin-pwa';
import devtools from 'solid-devtools/vite'
const manifest: Partial<ManifestOptions> = require('./manifest.json');
const pwaOptions: Partial<VitePWAOptions> = //
{
  registerType: 'autoUpdate',
  devOptions: {
    enabled: true,
    type: 'module',
    navigateFallback: '/index.html',
    navigateFallbackAllowlist: [/^\/$/],
  },
  includeAssets: ["**/*.{png,svg,ico,json,jpg}"],
  workbox: {
    globPatterns: [
      "**/*.{js,jsx,css,scss,ts,tsx,html,woff,woff2,otf}"
    ]
  },
  injectRegister: 'auto',
  outDir: '../wwwroot',
  // strategies: 'injectManifest',
  // filename: 'claims-sw.ts',
  // injectManifest: {
  //   minify: false,
  //   enableWorkboxModulesLogs: true,
  // },
  manifest: manifest,
};

export default defineConfig({
  plugins: [
    devtools({
      autoname: true, // e.g. enable autoname
    }),
    solidPlugin(),
    VitePWA(pwaOptions)
  ],
  server: {
    port: 3000
  },
  build: {
    target: 'esnext',
    outDir: '../wwwroot',
  }

});

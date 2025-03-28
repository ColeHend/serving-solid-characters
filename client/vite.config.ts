import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { ManifestOptions, VitePWA } from 'vite-plugin-pwa';
import devtools from 'solid-devtools/vite'
import eslint from 'vite-plugin-eslint'
// eslint-disable-next-line
const manifest: Partial<ManifestOptions> = require('./manifest.json');
// const pwaOptions: Partial<VitePWAOptions>;

export default defineConfig({
  plugins: [
    devtools({
      autoname: true, // e.g. enable autoname
    }),
    solidPlugin(),
    VitePWA({
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
        ],
        maximumFileSizeToCacheInBytes: 5020000
      },
      minify: true,
      injectRegister: 'auto',
      outDir: '../wwwroot',
      // strategies: 'injectManifest',
      // filename: 'claims-sw.ts',
      // injectManifest: { 
      //   minify: false, 
      //   enableWorkboxModulesLogs: true, 
      // },
      manifest: manifest,
    }),
    { // default settings on build (i.e. fail on error)
      ...eslint({
        failOnWarning: false,
        failOnError: true,
        include: [
          'src/components/**/*.ts', 
          'src/components/**/*.tsx',
          'src/models/**/*.ts',
          'src/models/**/*.tsx',
        ],
        fix: true,
        fixTypes: [
          "layout",
          "problem",
          "suggestion",
          "directive",
        ]
      }),
      apply: 'build',
    },
    { // do not fail on serve (i.e. local development)
      ...eslint({
        failOnWarning: false,
        failOnError: false,
        lintOnStart: true,
        include: [
          'src/components/**/*.ts', 
          'src/components/**/*.tsx',
          'src/models/**/*.ts',
          'src/models/**/*.tsx',
        ],
        fix: true,
        fixTypes: [
          "layout",
          "problem",
          "suggestion",
          "directive",
        ],
      }),
      apply: 'serve',
      enforce: 'post'
    }
  ],
  server: {
    port: 3000
  },
  build: {
    target: 'esnext',
    outDir: '../wwwroot',
  }

});

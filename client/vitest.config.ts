import solidPlugin from "vite-plugin-solid";
import { defineConfig } from "vitest/config";
import { useStyle } from "./src/shared";
import devtools from 'solid-devtools/vite'
import { ManifestOptions, VitePWAOptions, VitePWA } from "vite-plugin-pwa";
import path from 'path';
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
        // devtools({
        //     autoname: true, // e.g. enable autoname
        //   }),
        solidPlugin(),
        // VitePWA(pwaOptions)
    ],
  define: {
    'process.env.SASS_SILENCE_DEPRECATIONS': JSON.stringify('legacy-js-api')
  },
  resolve: {
    alias: {
      'coles-solid-library': path.resolve(__dirname, 'src/test/mocks/coles-solid-library/index.tsx'),
      'coles-solid-library/dist/components/Form/formHelp/models': path.resolve(__dirname, 'src/test/mocks/coles-solid-library/dist/components/Form/formHelp/models.ts'),
    }
  },
    // resolve: {
    //     conditions: ["development", "browser"],
    // },
    test: {
        "setupFiles": [
            "fake-indexeddb/auto",
            "./vitest.setup.ts"
        ],
  testTimeout: 15000,
        typecheck: {
            allowJs: true,
            tsconfig: "./tsconfig"
        }
    },
})



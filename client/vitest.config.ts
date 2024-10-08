import solidPlugin from "vite-plugin-solid";
import { defineConfig } from "vitest/config";
import { useStyle } from "./src/shared";
import devtools from 'solid-devtools/vite'
import { ManifestOptions, VitePWAOptions, VitePWA } from "vite-plugin-pwa";
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
    resolve: {
        conditions: ["development", "browser"],
    },
    test: {
        "setupFiles": [
            "fake-indexeddb/auto",
        ],
        typecheck: {
            allowJs: true,
            tsconfig: "./tsconfig"
        }
    },
})



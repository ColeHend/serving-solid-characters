import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { ManifestOptions, VitePWA } from 'vite-plugin-pwa';
import devtools from 'solid-devtools/vite'
import eslint from 'vite-plugin-eslint'
import fs from 'node:fs'
import path from 'node:path'
// eslint-disable-next-line
const manifest: Partial<ManifestOptions> = require('./manifest.json');
// const pwaOptions: Partial<VitePWAOptions>;

function devHttps() {
  // Prefer local client ssl folder (client/ssl/*)
  const keyPath = path.resolve(__dirname, 'ssl/dev-key.pem');
  const certPath = path.resolve(__dirname, 'ssl/dev-cert.pem');
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
  }
  // Fallback to repo root ssl (../ssl) so one generation can serve both .NET and Vite
  const rootKeyPath = path.resolve(__dirname, '../ssl/dev-key.pem');
  const rootCertPath = path.resolve(__dirname, '../ssl/dev-cert.pem');
  if (fs.existsSync(rootKeyPath) && fs.existsSync(rootCertPath)) {
    return {
      key: fs.readFileSync(rootKeyPath),
      cert: fs.readFileSync(rootCertPath)
    };
  }
  return undefined;
}

// Resolve backend URL (default to https://localhost:5000 when cert present, else http)
function resolveBackendTarget() {
  if (process.env.BACKEND_URL) return process.env.BACKEND_URL;
  const httpsCert = devHttps();
  return httpsCert ? 'https://localhost:5000' : 'http://localhost:5000';
}
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
      outDir: 'dist',
      strategies: 'injectManifest',
      // Change the filename to match what registerSW.js is looking for
      filename: 'claims-sw.js',
      injectManifest: {
        minify: false,
        enableWorkboxModulesLogs: true,
        maximumFileSizeToCacheInBytes: 5000000
      },
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
    https: devHttps(),
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: resolveBackendTarget(),
        changeOrigin: true,
        secure: false, // allow self-signed mkcert cert
        // Log proxy target for clarity
        configure: (_proxy, _options) => {
          console.log('[vite] proxy /api ->', resolveBackendTarget());
        }
      }
    }
  },
  preview: {
    https: devHttps()
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }

});

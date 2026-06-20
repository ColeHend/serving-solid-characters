import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { ManifestOptions, VitePWA } from 'vite-plugin-pwa';
import devtools from 'solid-devtools/vite'
import eslint from 'vite-plugin-eslint'
import colesSolidLibrary from 'coles-solid-library/vite'
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
  // Fallback to repo root ssl (../../ssl) so one generation can serve both .NET and Vite
  const rootKeyPath = path.resolve(__dirname, '../../ssl/dev-key.pem');
  const rootCertPath = path.resolve(__dirname, '../../ssl/dev-cert.pem');
  if (fs.existsSync(rootKeyPath) && fs.existsSync(rootCertPath)) {
    return {
      key: fs.readFileSync(rootKeyPath),
      cert: fs.readFileSync(rootCertPath)
    };
  }
  return undefined;
}

// Resolve backend URL (default to https://localhost:5000 when cert present, else http)
function hasBackendHttpsCert() {
  const backendPfxPath = path.resolve(__dirname, '../../ssl/dev-cert.pfx');
  return fs.existsSync(backendPfxPath);
}

function resolveBackendTarget() {
  if (process.env.BACKEND_URL) return process.env.BACKEND_URL;
  return hasBackendHttpsCert() ? 'https://localhost:5000' : 'http://localhost:5000';
}

const APP_VERSION = process.env.GIT_COMMIT || process.env.npm_package_version || 'dev';
const BUILD_TIME = new Date().toISOString();

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(APP_VERSION),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(BUILD_TIME),
    // Plain global defines so the injectManifest SW build (a separate pass) also gets
    // accurate build metadata regardless of import.meta.env propagation.
    '__APP_VERSION__': JSON.stringify(APP_VERSION),
    '__BUILD_TIME__': JSON.stringify(BUILD_TIME),
    '__SW_DEBUG__': JSON.stringify(false)
  },
  plugins: [
    devtools({
      autoname: true, // e.g. enable autoname
    }),
    solidPlugin(),
    // Supplies solid-js dedupe + the library/icon-barrel optimizeDeps.include this app needs
    // (forces a single solid-js instance and tree-shakes the icon barrels in dev).
    colesSolidLibrary(),
  VitePWA({
      // Auto-update: a new SW activates and the page reloads automatically (driven in
      // register.ts). Critical for the installed/offline case — it guarantees the corrected
      // SW (with the complete precache) takes control instead of stranding behind an old SW.
      // A vite:preloadError safety net (preloadRecovery.ts) auto-heals any chunk mismatch.
      // registerType 'autoUpdate' surfaces a new SW via onNeedRefresh (register.ts). We do NOT
      // auto-reload — the user applies the update via the ReloadPrompt toast (prompt-to-reload),
      // so an in-progress character edit is never discarded. A vite:preloadError safety net
      // (preloadRecovery.ts) still auto-heals a chunk mismatch on a stale SW.
      registerType: 'autoUpdate',
      devOptions: {
    enabled: false, // SW disabled in dev; registered only in prod (see register.ts)
    type: 'module',
    navigateFallback: '/index.html'
      },
      // No includeAssets: globPatterns below globs the built dist (which already includes
      // copied public/ assets), so a single precache source keeps globIgnores authoritative.
      minify: true,
  // We'll manually register in index.tsx to control timing
  injectRegister: null,
      outDir: 'dist',
      strategies: 'injectManifest',
      // injectManifest resolves the SW source from srcDir + filename (it ignores
      // injectManifest.swSrc). Point it straight at the TypeScript source; the plugin compiles
      // it and emits dist/claims-sw.js (the .ts → .js name swap is automatic). This makes the
      // build self-contained — no pre-built public/claims-sw.js is required.
      srcDir: 'src/pwa',
      filename: 'claims-sw.ts',
      // NOTE: with the injectManifest strategy, precache globbing is configured HERE,
      // not under `workbox` (that block only applies to the generateSW strategy and was
      // being silently ignored). Patterns target the built `dist/` output, so we glob the
      // real emitted extensions plus fonts, the PDF template, and images for full offline.
      injectManifest: {
        minify: false, // keep the SW readable for debugging; the pwa:smoke test scans it as text
        // enableWorkboxModulesLogs omitted (defaults off) — keep workbox internals quiet in prod
        globPatterns: [
          '**/*.{js,css,html,woff,woff2,otf,png,jpg,jpeg,svg,webp,pdf,json,ico,webmanifest}'
        ],
        // Precache everything for full offline. The route-background art is shipped as WebP
        // (~0.2MB each vs ~2.5MB PNG), so the whole install is only a few MB. Only source maps
        // are excluded. The cap is set just above the largest real asset (the pdf-lib chunk,
        // ~0.4MB) with headroom for vendor-chunk growth, so a multi-MB asset trips the build
        // (Workbox warns + skips) instead of silently inflating the install.
        globIgnores: ['**/*.map'],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
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
        emitWarning: false, // silence the warning long-tail in the dev terminal (still shown by IDE + build)
        emitError: true,    // still surface real errors
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
    },
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
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Split heavy vendors into stable, separately-cacheable chunks. pdf-lib and
        // tesseract.js are only reached via lazy routes / dynamic import, so their chunks
        // load on demand; the rest are app-wide and stay cached across deploys.
        manualChunks: {
          'pdf-lib': ['pdf-lib'],
          'ocr': ['tesseract.js'],
          'db': ['dexie'],
          'markdown': ['marked', 'dompurify'],
          'ui': ['coles-solid-library'],
          'solid': ['solid-js', '@solidjs/router', 'rxjs'],
        }
      }
    }
  }
});


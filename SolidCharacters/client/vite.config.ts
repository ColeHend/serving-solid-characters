import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { ManifestOptions, VitePWA } from 'vite-plugin-pwa';
import devtools from 'solid-devtools/vite'
import eslint from 'vite-plugin-eslint'
import fs from 'node:fs'
import path from 'node:path'
import esbuild from 'esbuild'
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
export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.GIT_COMMIT || process.env.npm_package_version || 'dev'),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString())
  },
  plugins: [
    devtools({
      autoname: true, // e.g. enable autoname
    }),
    solidPlugin(),
  VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
    enabled: false, // we'll manage dev SW manually
    type: 'module',
    navigateFallback: '/index.html'
      },
      includeAssets: ["**/*.{png,svg,ico,json,jpg}"],
      workbox: {
        globPatterns: [
          "**/*.{js,jsx,css,scss,ts,tsx,html,woff,woff2,otf}"
        ],
        maximumFileSizeToCacheInBytes: 5020000
      },
      minify: true,
  // We'll manually register in index.tsx to control timing
  injectRegister: null,
      outDir: 'dist',
      strategies: 'injectManifest',
      // Change the filename to match what registerSW.js is looking for
      filename: 'claims-sw.js',
      injectManifest: {
        minify: false,
        enableWorkboxModulesLogs: true,
        maximumFileSizeToCacheInBytes: 5000000,
        swSrc: 'src/pwa/claims-sw.ts'
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
    },
    {
      name: 'dev-sw-builder',
      apply: 'serve',
      async buildStart() {
        await buildDevSw();
      },
      async handleHotUpdate(ctx) {
        if (ctx.file.endsWith('src/pwa/claims-sw.ts')) {
          await buildDevSw();
          ctx.server.ws.send({type:'custom', event:'sw:rebuilt'});
        }
      }
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

async function buildDevSw() {
  const src = path.resolve(__dirname, 'src/pwa/claims-sw.ts');
  const out = path.resolve(__dirname, 'public/claims-sw.js');
  try {
    if (!fs.existsSync(src)) return;
    const result = await esbuild.build({
      entryPoints: [src],
      bundle: true,
      format: 'esm',
      platform: 'browser',
      sourcemap: true,
      outfile: out,
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
      }
    });
    console.log('[dev-sw-builder] built claims-sw.js');
  } catch (e) {
    console.warn('[dev-sw-builder] failed', e);
  }
}

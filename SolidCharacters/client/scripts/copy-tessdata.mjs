#!/usr/bin/env node
/**
 * Vendors tesseract.js (OCR) runtime assets into public/tessdata/ so the image-to-text feature
 * works fully offline instead of fetching ~14MB from a CDN at runtime. Vite copies public/ into
 * dist/, and the service worker caches /tessdata/* (CacheFirst 'ocr-assets' route in claims-sw.ts).
 *
 *  - worker.min.js  + the SIMD-LSTM single-file core are copied from node_modules (offline, fast,
 *    kept in sync with the installed tesseract version). Must match src/pwa/offline/ocrAssets.ts.
 *  - eng.traineddata.gz is downloaded once from the jsdelivr CDN (the same source tesseract uses by
 *    default for the LSTM model) only if it isn't already present.
 *
 * Runs automatically before `npm run build` (the `prebuild` script). Failures are non-fatal: the
 * build still succeeds and OCR simply falls back to the CDN when online (imageToText.ts).
 */
import { existsSync, mkdirSync, copyFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const log = (msg) => console.log(`[copy-tessdata] ${msg}`);
const warn = (msg) => console.warn(`[copy-tessdata] WARN: ${msg}`);

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destDir = path.join(clientRoot, 'public', 'tessdata');

// Source files in node_modules and the matching destination names (keep in sync with ocrAssets.ts).
const COPY = [
  {
    from: path.join(clientRoot, 'node_modules', 'tesseract.js', 'dist', 'worker.min.js'),
    to: path.join(destDir, 'worker.min.js'),
  },
  {
    from: path.join(clientRoot, 'node_modules', 'tesseract.js-core', 'tesseract-core-simd-lstm.wasm.js'),
    to: path.join(destDir, 'tesseract-core-simd-lstm.wasm.js'),
  },
];

// LSTM model: the same source tesseract.js uses by default (worker-script/index.js).
const LANG_URL = 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz';
const LANG_DEST = path.join(destDir, 'eng.traineddata.gz');

async function main() {
  mkdirSync(destDir, { recursive: true });

  let copied = 0;
  for (const { from, to } of COPY) {
    if (!existsSync(from)) {
      warn(`source missing: ${path.relative(clientRoot, from)} — is tesseract.js installed?`);
      continue;
    }
    copyFileSync(from, to);
    copied++;
    log(`copied ${path.basename(to)} (${(statSync(to).size / 1048576).toFixed(1)} MB)`);
  }
  if (copied < COPY.length) warn('some OCR core assets were not copied; offline OCR may be unavailable');

  if (existsSync(LANG_DEST) && statSync(LANG_DEST).size > 0) {
    log(`eng.traineddata.gz already present (${(statSync(LANG_DEST).size / 1048576).toFixed(1)} MB) — skipping download`);
    return;
  }

  if (typeof fetch !== 'function') {
    warn('global fetch unavailable (Node < 18); cannot download eng.traineddata.gz — offline OCR disabled until provided');
    return;
  }

  try {
    log(`downloading eng.traineddata.gz from ${LANG_URL} …`);
    const res = await fetch(LANG_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) throw new Error('empty response');
    writeFileSync(LANG_DEST, buf);
    log(`downloaded eng.traineddata.gz (${(buf.length / 1048576).toFixed(1)} MB)`);
  } catch (e) {
    warn(`could not download eng.traineddata.gz: ${e?.message ?? e}`);
    warn('offline OCR will be unavailable until this file exists; OCR still works online via the CDN');
  }
}

main().catch((e) => {
  warn(`unexpected error: ${e?.message ?? e}`);
  // Non-fatal — never block the build on OCR vendoring.
  process.exit(0);
});

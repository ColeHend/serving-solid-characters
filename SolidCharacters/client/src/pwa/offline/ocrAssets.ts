/**
 * Self-hosted OCR (tesseract.js) asset locations. Tesseract normally pulls its worker, wasm core,
 * and language data from a CDN at runtime, which makes the image-to-text feature unavailable
 * offline. We vendor these under /tessdata/ (populated by scripts/copy-tessdata.mjs at build) and
 * serve them same-origin so the service worker can cache them (see the `ocr-assets` CacheFirst route
 * in claims-sw.ts) and the offline preloader can warm them (preloadSrd.ts).
 *
 * Keep the core filename in sync with tesseract's own selection: createWorker uses OEM.LSTM_ONLY by
 * default, so on a SIMD-capable browser it picks `tesseract-core-simd-lstm.wasm.js`. The .wasm.js
 * files are single-file (the wasm is embedded as base64), so no companion .wasm is needed. SIMD is
 * universal in PWA-capable browsers; imageToText.ts falls back to the CDN if a core ever fails to
 * load while online.
 */

export const OCR_CACHE_NAME = "ocr-assets";

export const OCR_WORKER_PATH = "/tessdata/worker.min.js";
/** Pinned single-file SIMD-LSTM core (matches tesseract's default selection on SIMD browsers). */
export const OCR_CORE_PATH = "/tessdata/tesseract-core-simd-lstm.wasm.js";
/** Directory tesseract appends `${lang}.traineddata.gz` to (gzip is on by default). */
export const OCR_LANG_PATH = "/tessdata";
export const OCR_LANG_FILE = "/tessdata/eng.traineddata.gz";

/** Everything that must be cached for image-to-text to work fully offline. */
export const OCR_ASSET_URLS: readonly string[] = [
  OCR_WORKER_PATH,
  OCR_CORE_PATH,
  OCR_LANG_FILE,
];

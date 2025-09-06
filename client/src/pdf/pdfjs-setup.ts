// Centralized PDF.js setup for Vite + pdfjs-dist v4.
// Uses Vite's ?url import to get an emitted worker asset URL.
// This avoids manual copying / stubs and the GlobalWorkerOptions error.

import { GlobalWorkerOptions, getDocument, version } from 'pdfjs-dist';
// Vite will turn this into the final public URL of the worker file.
// The 'as any' cast silences potential TS module augmentation quirks.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (!GlobalWorkerOptions.workerSrc) {
  GlobalWorkerOptions.workerSrc = workerSrc;
  // eslint-disable-next-line no-console
  console.debug('[PDF_SETUP] Worker src set via Vite asset import', workerSrc);
}

export { getDocument, GlobalWorkerOptions, version };

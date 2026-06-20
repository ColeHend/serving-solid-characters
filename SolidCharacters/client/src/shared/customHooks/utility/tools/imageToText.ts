import type Tesseract from "tesseract.js";
import { Setter } from "solid-js";
import { addSnackbar } from "coles-solid-library";
import { OCR_CORE_PATH, OCR_LANG_PATH, OCR_WORKER_PATH } from "../../../../pwa/offline/ocrAssets";

// Point tesseract at our self-hosted, service-worker-cached assets so OCR works offline. workerBlobURL
// must be false so the worker is loaded from /tessdata/ (within the SW scope) and its importScripts/
// fetch for the core + language data are intercepted and served from Cache Storage when offline.
// See ocrAssets.ts / claims-sw.ts / preloadSrd.ts.
const OFFLINE_OPTS = {
  workerPath: OCR_WORKER_PATH,
  corePath: OCR_CORE_PATH,
  langPath: OCR_LANG_PATH,
  workerBlobURL: false,
} as const;

async function createOcrWorker(): Promise<Tesseract.Worker> {
  const { default: TesseractRuntime } = await import("tesseract.js");
  try {
    return await TesseractRuntime.createWorker("eng", undefined, OFFLINE_OPTS);
  } catch (e) {
    // The self-hosted assets failed to load (e.g. not yet vendored, or a non-SIMD browser). When
    // online, fall back to tesseract's CDN defaults so OCR still works; when offline, re-throw.
    if (navigator.onLine) {
      console.warn("[ocr] self-hosted assets failed; falling back to CDN", e);
      return TesseractRuntime.createWorker("eng");
    }
    throw e;
  }
}

const useImageToText = async (imageText: Tesseract.ImageLike, setter: Setter<string>, callback?: () => any) => {
  // Offline OCR needs the self-hosted assets cached first (download offline data while online).
  if (!navigator.onLine) {
    const cached = typeof caches !== "undefined" && (await caches.match(OCR_CORE_PATH).catch(() => undefined));
    if (!cached) {
      addSnackbar({
        severity: "info",
        message: "Text-from-image needs an internet connection (or download offline data first).",
      });
      callback?.();
      return;
    }
  }

  let worker: Tesseract.Worker;
  try {
    worker = await createOcrWorker();
  } catch (e) {
    console.error("[ocr] failed to start", e);
    addSnackbar({ severity: "error", message: "Couldn't start text recognition. Try again when online." });
    callback?.();
    return;
  }

  try {
    const res = await worker.recognize(imageText);
    setter((old) => (!old ? res.data.text : old + "\n" + res.data.text));
  } catch (e) {
    console.error("[ocr] recognition failed", e);
    addSnackbar({ severity: "error", message: "Text recognition failed." });
  } finally {
    await worker.terminate();
    callback?.();
  }
};

export { useImageToText };
export default useImageToText;

// Simplified initializer now that we rely on Vite asset resolution.
import { getDocument, GlobalWorkerOptions, version } from '../../../../pdf/pdfjs-setup';

export function pdfGetDocument(params: any) {
  const merged = {
    disableRange: true,
    disableAutoFetch: true,
    disableStream: false,
    isEvalSupported: false,
    useSystemFonts: true,
    ...params
  };
  // eslint-disable-next-line no-console
  console.debug('[PDF_GET_DOCUMENT]', { version, hasWorker: !!GlobalWorkerOptions.workerSrc });
  return getDocument(merged);
}
// Minimal compatibility object for legacy logging sites expecting pdfjsLib
export const pdfjsLib = { version } as const;

export { GlobalWorkerOptions };

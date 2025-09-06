import { pdfGetDocument } from '../pdfjs-init';
import type { MapperCtx } from './runtime';

export function createPdfLoader(ctx: MapperCtx) {
  async function ensurePdfLoaded(bytes: Uint8Array){
    if (!bytes.length) return null; const rt = ctx.runtime;
    if (ctx.pdfDoc() && rt.lastPdfBytesRef === bytes) return ctx.pdfDoc();
    if (rt.loadTaskPromise && rt.loadingBytesRef === bytes) return rt.loadTaskPromise;
    if (rt.lastPdfBytesRef && rt.lastPdfBytesRef !== bytes) { ctx.setPageIndex(0); ctx.setRequestedPageIndex(null); ctx.setRequestedScale(null); ctx.setBasePageImage(null); ctx.setPageCount(1); rt.renderAttemptsByKey.clear(); rt.textWidthCache.clear(); rt.fieldRenderCache.clear(); rt.renderInProgress=false; rt.activeRenderCanvas=null; }
    rt.loadingBytesRef = bytes;
    const getter = ctx.opts.getDocument || pdfGetDocument;
    if (ctx.opts.debug) console.debug('[PDF_LOAD_BEGIN]', { size: bytes.length });
    try {
      const loadResult = getter({ data: bytes, disableRange:true, disableAutoFetch:true, disableStream:false, isEvalSupported:false, useSystemFonts:true, cMapPacked:true });
      const p = (loadResult as any).promise || Promise.resolve(loadResult);
      rt.loadTaskPromise = p.then((doc:any)=> { ctx.setPdfDoc(doc); rt.lastPdfBytesRef = bytes; ctx.setPageCount(doc.numPages||1); rt.renderAttemptsByKey.clear(); if (ctx.opts.debug) console.debug('[PDF_LOAD_SUCCESS]', { pages: doc.numPages }); return doc; }).catch((e:any)=> { ctx.setError(`Failed to load PDF: ${e?.message||'Unknown error'}`); return null; }).finally(()=> { rt.loadTaskPromise=null; rt.loadingBytesRef=null; if (ctx.opts.debug) console.debug('[PDF_LOAD_END]'); });
    } catch (e:any) { ctx.setError(`Failed to load PDF: ${e?.message||'Unexpected error'}`); rt.loadTaskPromise=Promise.resolve(null); }
    return rt.loadTaskPromise;
  }
  return { ensurePdfLoaded };
}

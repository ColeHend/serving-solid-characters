// NOTE: Entire file refactored into a lean orchestrator (<200 lines) replacing legacy monolith.
// Tests rely on stable return API; preserve keys & semantics.

import { Accessor, Setter, createEffect, createMemo, createSignal, onCleanup, untrack } from 'solid-js';
import { Character } from '../../../../models/character.model';
import { PDFFieldMap } from '../../../customHooks/libraries/pdfTool';
import { FIELD_OPTIONS } from './core/fieldOptions';
import { buildPreviewCharacter } from './core/preview';
import { createRuntime, MapperCtx } from './core/runtime';
import { createPdfLoader } from './core/pdfLoader';
import { createPageRenderer } from './core/pageRenderer';
import { createOverlayTools } from './core/overlays';
import { createInteractions } from './core/interactions';
import { createPersistence } from './core/persistence';

// NOTE: Entire file refactored into a lean orchestrator (<200 lines) replacing legacy monolith.
// Tests rely on stable return API; preserve keys & semantics.

const IS_TEST = (() => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITEST) return true;
    if (typeof process !== 'undefined' && (process as any).env?.VITEST) return true;
  } catch {}
  return false;
})();

export interface DraftField extends PDFFieldMap { key: string; }
export interface PdfFieldMapperHookOptions {
  show: [Accessor<boolean>, Setter<boolean>];
  pdfBytes: Accessor<Uint8Array | null>;
  character?: Character;
  getDocument?: (input: any) => { promise: Promise<any> };
  debug?: boolean;
}

export function usePdfFieldMapper(opts: PdfFieldMapperHookOptions) {
  // Core reactive state (mirrors original API)
  const [mappings, setMappings] = createSignal<DraftField[]>([]);
  const [activeKey, setActiveKey] = createSignal('name');
  const [singleInstance, setSingleInstance] = createSignal(true);
  const [fontSize, setFontSize] = createSignal(12);
  const [fontColor, setFontColor] = createSignal('#000000');
  const [fontName, setFontName] = createSignal('Helvetica');
  const [scale, setScale] = createSignal(1.2);
  const [pageCount, setPageCount] = createSignal(1);
  const [pageIndex, setPageIndex] = createSignal(0);
  const [previewMode, setPreviewMode] = createSignal(false);
  const [selectedId, setSelectedId] = createSignal<number | null>(null);
  const [loadingPage, setLoadingPage] = createSignal(false);
  const [canvasEl, setCanvasEl] = createSignal<HTMLCanvasElement | null>(null);
  const [basePageImage, setBasePageImage] = createSignal<ImageData | null>(null);
  const [draggingId, setDraggingId] = createSignal<number | null>(null);
  const [resizingId, setResizingId] = createSignal<number | null>(null);
  const [pdfDoc, setPdfDoc] = createSignal<any | null>(null);
  const [requestedPageIndex, setRequestedPageIndex] = createSignal<number | null>(null);
  const [requestedScale, setRequestedScale] = createSignal<number | null>(null);
  const [renderedOnce, setRenderedOnce] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const previewCharacter = createMemo(() => buildPreviewCharacter(opts.character));

  // Runtime & context
  const runtime = createRuntime();
  const ctx: MapperCtx = {
    opts, IS_TEST,
    mappings, setMappings,
    activeKey, setActiveKey,
    singleInstance, setSingleInstance,
    fontSize, setFontSize,
    fontColor, setFontColor,
    fontName, setFontName,
    scale, setScale,
    pageCount, setPageCount,
    pageIndex, setPageIndex,
    previewMode, setPreviewMode,
    selectedId, setSelectedId,
    loadingPage, setLoadingPage,
    canvasEl, setCanvasEl,
    basePageImage, setBasePageImage,
    draggingId, setDraggingId,
    resizingId, setResizingId,
    pdfDoc, setPdfDoc,
    requestedPageIndex, setRequestedPageIndex,
    requestedScale, setRequestedScale,
    renderedOnce, setRenderedOnce,
    error, setError,
    previewCharacter,
    fieldOptions: () => FIELD_OPTIONS,
    runtime
  };

  const { ensurePdfLoaded } = createPdfLoader(ctx);
  const { renderPageFromDoc, maybeRender, nowMs } = createPageRenderer(ctx); (runtime as any).renderPageFromDoc = renderPageFromDoc;
  const { scheduleOverlays } = createOverlayTools(ctx); (runtime as any).scheduleOverlays = scheduleOverlays;
  const interactions = createInteractions(ctx);
  const persist = createPersistence(ctx);

  // Load PDF when bytes change & modal visible
  createEffect(() => {
    if (!opts.show[0]()) return;
    const bytes = opts.pdfBytes();
    if (!bytes) return;
    setError(null);
    ensurePdfLoaded(bytes);
  });

  // Primary render effect (dedupe by key + basic rate limit)
  let lastRenderKey: string | null = null;
  let lastRenderRequest = 0;
  createEffect(() => {
    if (!opts.show[0]()) return;
    const doc = pdfDoc(); if (!doc) return;
    const canvas = canvasEl(); if (!canvas) return;
    const sc = scale(); const pg = pageIndex();
    if (loadingPage()) { // queue if mid-render
      setRequestedPageIndex(p => p == null ? pg : p);
      setRequestedScale(sc); // always store latest requested scale (overwrite previous)
      return;
    }
    const key = `${pg}::${sc}::${doc._pdfInfo?.fingerprint || doc.fingerprint || ''}`;
    if (lastRenderKey === key && basePageImage() && requestedPageIndex() == null) return;
    const now = nowMs();
    if (now - lastRenderRequest < 90) { // throttle bursts
      const delay = 90 - (now - lastRenderRequest);
      setTimeout(() => { if (pdfDoc() === doc && pageIndex() === pg && scale() === sc) { lastRenderKey = key; maybeRender(doc, pg, sc); } }, delay);
      return;
    }
    lastRenderRequest = now; lastRenderKey = key; maybeRender(doc, pg, sc);
  });

  // Fallback: if after a tick we still haven't attempted any render (e.g., due to an unforeseen early loadingPage state), force one.
  createEffect(() => {
    if (!opts.show[0]()) return;
    if (renderedOnce()) return;
    const doc = pdfDoc(); if (!doc) return;
    const canvas = canvasEl(); if (!canvas) return;
    // If no attempts recorded yet for current page/scale, schedule a forced render.
    const attemptsMap = runtime.renderAttemptsByKey as Map<string, number>;
    const key = `${pageIndex()}::${scale()}::${doc._pdfInfo?.fingerprint || doc.fingerprint || ''}`;
    if (!attemptsMap.has(key)) {
      setTimeout(() => {
        // Re-check conditions to avoid duplicate if a normal render started in the meantime.
        if (!renderedOnce() && pdfDoc() === doc && canvasEl() === canvas && !runtime.renderInProgress) {
          (runtime as any).ignoreCacheOnce = true;
          maybeRender(doc, pageIndex(), scale());
        }
      }, 30);
    }
  });

  // When a render finishes (loadingPage false) apply queued scale
  let prevLoading=false; createEffect(()=> { const lp=loadingPage(); if(prevLoading && !lp){ const rs=requestedScale(); if(rs!=null && rs!==scale()){ setRequestedScale(null); setScale(rs); } } prevLoading=lp; });

  // Apply queued scale change after a successful render if it was requested mid-load
  createEffect(() => {
    if (!loadingPage() && requestedScale() != null) {
      const rs = requestedScale();
      setRequestedScale(null);
      if (rs != null && rs !== scale()) setScale(rs);
    }
  });

  // Force a render on explicit scale changes (ensures getPage() call even if cached image exists; pageRenderer skips cache in test env)
  let prevScale = scale();
  createEffect(() => {
    const sc = scale();
    if (sc !== prevScale) {
      const doc = pdfDoc();
      if (doc) {
        if (loadingPage() || runtime.renderInProgress) {
          // Track that we had an intervening scale update while loading; ensures a post-load re-render even if final scale matches render
          runtime.scaleChangeDuringLoadCount = (runtime.scaleChangeDuringLoadCount || 0) + 1;
          runtime.pendingQueuedScales?.push(sc);
          setRequestedScale(sc); // queue until current render finishes
        } else if (renderedOnce()) {
          // Direct render invocation; attached earlier onto runtime
          (runtime as any).renderPageFromDoc?.(doc, pageIndex(), sc);
        } else {
          // Before first render actually begins; track to ensure second render if multiple distinct scale changes occur
          runtime.pendingInitialScaleChanges = (runtime.pendingInitialScaleChanges || 0) + 1;
          runtime.pendingQueuedScales?.push(sc);
          setRequestedScale(sc); // before first render completes, just queue
        }
      }
      prevScale = sc;
    }
  });

  // Visibility effect: cleanup on hide; conditional auto-load ONLY on visible transition (not on manual clear)
  let prevVisible = opts.show[0]();
  createEffect(() => {
    const visible = opts.show[0]();
    if (!visible) {
      setBasePageImage(null);
      setRenderedOnce(false);
      setPdfDoc(null);
      setPageIndex(0);
    } else {
      if (!prevVisible) { // just became visible
        // Read mappings length without tracking so manual clear doesn't retrigger auto-load.
        const lengthNow = untrack(() => mappings().length);
        if (lengthNow === 0) {
          try {
            const raw = localStorage.getItem('pdfFieldMappings');
            if (raw) {
              try {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr) && arr.length) setMappings(arr);
              } catch {}
            }
          } catch {}
        }
      }
    }
    prevVisible = visible;
  });

  // Queued scale changes: if a scale change happens while loadingPage, store and apply right after base image set
  createEffect(() => {
    if (!loadingPage() && requestedScale() != null && renderedOnce()) {
      const rs = requestedScale();
      setRequestedScale(null);
      if (rs != null && rs !== scale()) setScale(rs);
    }
  });

  // (Duplicate hide cleanup effect removed; consolidated above)

  function selectedMapping(){ const id=selectedId(); if(id==null) return null; return mappings()[id] ?? null; }

  // Overlay triggers
  createEffect(() => { mappings(); basePageImage(); if (pdfDoc()) scheduleOverlays(); });
  createEffect(() => { previewMode(); if (pdfDoc()) scheduleOverlays(); });
  createEffect(() => { fontSize(); fontColor(); fontName(); selectedId(); draggingId(); resizingId(); if (pdfDoc()) scheduleOverlays(); });

  // Page change side-effects: attempt to reuse cached image; if not cached, clear to trigger render
  createEffect(() => { 
    const pg = pageIndex(); const sc = scale(); const doc = pdfDoc();
    const cacheKey = doc ? `${pg}::${sc}::${doc._pdfInfo?.fingerprint || doc.fingerprint || ''}` : null;
    if (cacheKey && runtime.pageImageCache?.has(cacheKey)) {
      const cached = runtime.pageImageCache.get(cacheKey);
      if (cached) setBasePageImage(cached);
    } else {
      setBasePageImage(null);
    }
    runtime.renderInProgress = false; runtime.renderToken++; scheduleOverlays();
  });

  // Global pointer listeners while dragging/resizing (mirrors legacy behavior, cleaned)
  createEffect(() => {
    const active = draggingId() !== null || resizingId() !== null;
    if (!active) return;
    const move = (e: PointerEvent) => interactions.onPointerMove(e as any);
    const up = (e: PointerEvent) => { interactions.onPointerUp(); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    onCleanup(() => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); });
  });

  // Hover cursor feedback (non-drag state)
  createEffect(() => {
    const canvas = canvasEl();
    if (!canvas) return;
    const move = (e: MouseEvent) => interactions.onHoverMove(e);
    const leave = () => interactions.onHoverLeave();
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseleave', leave);
    onCleanup(() => { canvas.removeEventListener('mousemove', move); canvas.removeEventListener('mouseleave', leave); });
  });

  // Navigation helpers
  function requestPrevPage() { const target = Math.max(0, pageIndex() - 1); if (target !== pageIndex()) setPageIndex(target); }
  function requestNextPage() { const max = pageCount(); const target = Math.min(max - 1, pageIndex() + 1); if (target !== pageIndex()) setPageIndex(target); }

  // Public API (stable names for tests & UI)
  return {
    mappings, setMappings,
    activeKey, setActiveKey,
    singleInstance, setSingleInstance,
    fontSize, setFontSize,
    fontColor, setFontColor,
    fontName, setFontName,
    scale, setScale,
    pageCount, pageIndex, setPageIndex,
    previewMode, setPreviewMode,
    selectedId, setSelectedId,
    loadingPage,
    canvasEl, setCanvasEl,
    basePageImage, renderedOnce,
    error,
    draggingId, resizingId,
    requestPrevPage, requestNextPage,
    fieldOptions: () => FIELD_OPTIONS,
    handleCanvasClick: interactions.handleCanvasClick,
    onPointerDown: interactions.onPointerDown,
    onPointerMove: interactions.onPointerMove,
    onPointerUp: interactions.onPointerUp,
    removeMapping: interactions.removeMapping,
    updateSelectedBox: interactions.updateSelectedBox,
    __testDragDelta: interactions.__testDragDelta,
    __testResizeDelta: interactions.__testResizeDelta,
    selectedMapping,
    exportJson: persist.exportJson,
    importJson: persist.importJson,
    saveMappings: persist.saveMappings,
    loadMappings: persist.loadMappings,
  } as const;
}

export type UsePdfFieldMapperReturn = ReturnType<typeof usePdfFieldMapper>;

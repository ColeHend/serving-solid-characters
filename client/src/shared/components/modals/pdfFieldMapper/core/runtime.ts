import type { DraftField, PdfFieldMapperHookOptions } from '../usePdfFieldMapper';
import type { Accessor, Setter } from 'solid-js';
import type { Character } from '../../../../../models/character.model';

export interface MapperCtx {
  opts: PdfFieldMapperHookOptions;
  IS_TEST: boolean;
  mappings: Accessor<DraftField[]>; setMappings: Setter<DraftField[]>;
  activeKey: Accessor<string>; setActiveKey: Setter<string>;
  singleInstance: Accessor<boolean>; setSingleInstance: Setter<boolean>;
  fontSize: Accessor<number>; setFontSize: Setter<number>;
  fontColor: Accessor<string>; setFontColor: Setter<string>;
  fontName: Accessor<string>; setFontName: Setter<string>;
  scale: Accessor<number>; setScale: Setter<number>;
  pageCount: Accessor<number>; setPageCount: Setter<number>;
  pageIndex: Accessor<number>; setPageIndex: Setter<number>;
  previewMode: Accessor<boolean>; setPreviewMode: Setter<boolean>;
  selectedId: Accessor<number|null>; setSelectedId: Setter<number|null>;
  loadingPage: Accessor<boolean>; setLoadingPage: Setter<boolean>;
  canvasEl: Accessor<HTMLCanvasElement|null>; setCanvasEl: Setter<HTMLCanvasElement|null>;
  basePageImage: Accessor<ImageData|null>; setBasePageImage: Setter<ImageData|null>;
  draggingId: Accessor<number|null>; setDraggingId: Setter<number|null>;
  resizingId: Accessor<number|null>; setResizingId: Setter<number|null>;
  pdfDoc: Accessor<any|null>; setPdfDoc: Setter<any|null>;
  requestedPageIndex: Accessor<number|null>; setRequestedPageIndex: Setter<number|null>;
  requestedScale: Accessor<number|null>; setRequestedScale: Setter<number|null>;
  renderedOnce: Accessor<boolean>; setRenderedOnce: Setter<boolean>;
  error: Accessor<string|null>; setError: Setter<string|null>;
  previewCharacter: Accessor<Character>;
  fieldOptions: () => string[];
  runtime: Record<string, any>;
}

export function createRuntime() {
  return {
    lastPdfBytesRef: null as Uint8Array | null,
    loadTaskPromise: null as Promise<any> | null,
    loadingBytesRef: null as Uint8Array | null,
    renderToken: 0,
    lastRenderKey: null as string | null,
    overlayScheduled: false,
    recentRenderTimestamps: [] as number[],
    totalRenderAttempts: 0,
    suppressRendersUntil: 0,
    renderAttemptsByKey: new Map<string, number>(),
    activeRenderCanvas: null as HTMLCanvasElement | null,
    renderInProgress: false,
    lastRenderStartTime: 0,
    offscreenCanvas: null as HTMLCanvasElement | null,
    textWidthCache: new Map<string, number>(),
    fieldRenderCache: new Map<string, ImageData>(),
    lastCacheKey: '',
    overlayDebounceTimer: null as any,
    overlayRafId: null as number | null,
    lastOverlayDrawTime: 0,
    overlayCanvas: null as HTMLCanvasElement | null,
    lastOverlayCanvasSize: { width: 0, height: 0 },
  // Cache of rendered base page images per page+scale fingerprint to avoid repeated expensive renders when navigating back/forth.
  pageImageCache: new Map<string, ImageData>(),
    dragUpdateTimeout: null as any,
    pendingMappingsUpdate: null as DraftField[] | null,
    lastPointerMoveTime: 0,
    boxOriginal: undefined as any,
    dragOffset: undefined as any,
    MAX_RENDERS_PER_SEC: 10,
    MAX_TOTAL_RENDERS: 500,
    MAX_RENDER_ATTEMPTS_PER_PAGE: 15,
  // Tracks how many scale updates occurred while a page render was in progress/loading
  scaleChangeDuringLoadCount: 0,
  lastRenderScale: 0,
  pendingInitialScaleChanges: 0,
  pendingQueuedScales: [] as number[],
  // When true, the next render invocation will bypass the cache fast path even if an image exists.
  ignoreCacheOnce: false,
  };
}

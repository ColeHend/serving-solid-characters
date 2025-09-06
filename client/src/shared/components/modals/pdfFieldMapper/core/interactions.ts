import type { MapperCtx } from './runtime';
import { hexToRgb01 } from './colors';

const DEFAULT_BOX = { width: 120, height: 18 };
const RESIZE_HANDLE_SIZE = 8; // px in canvas space (scaled already when we compare)

export function createInteractions(ctx: MapperCtx) {
  function parseCurrentStyle() {
    const rgb = hexToRgb01(ctx.fontColor());
    return { fontSize: ctx.fontSize(), fontName: ctx.fontName() as any, fontColor: rgb };
  }

  // Enforce only when the singleInstance flag is enabled
  function enforceSingleInstance(key: string): number {
    if (!ctx.singleInstance()) return -1;
    if (key === 'static') return -1;
    return ctx.mappings().findIndex(m => m.key === key);
  }

  // Click to create OR select existing
  function handleCanvasClick(e: MouseEvent) {
    if (ctx.previewMode()) return;
    const canvas = ctx.canvasEl(); if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const sc = ctx.scale();
    const h = canvas.height;

    // First check for existing mapping under pointer (top-most priority)
    for (let i = ctx.mappings().length - 1; i >= 0; i--) {
      const m = ctx.mappings()[i];
      if ((m.page ?? 0) !== ctx.pageIndex()) continue;
      const bx = m.llc.x * sc;
      const byB = m.llc.y * sc;
      const bw = (m.urc.x - m.llc.x) * sc;
      const bh = (m.urc.y - m.llc.y) * sc;
      const by = h - byB - bh;
      if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
        ctx.setSelectedId(i);
        ctx.runtime.scheduleOverlays?.();
        return;
      }
    }

    // Otherwise (blank area)
    // If the immediate prior pointerDown was blank and there WAS a selection then we treat this as a pure deselect
    if (ctx.runtime.prevSelectedIdBeforeBlank !== undefined) {
      const prev = ctx.runtime.prevSelectedIdBeforeBlank;
      ctx.runtime.prevSelectedIdBeforeBlank = undefined; // consume flag
      if (prev !== null) {
        ctx.setSelectedId(null);
        ctx.runtime.scheduleOverlays?.();
        return; // don't create a box yet; first blank click just deselects
      }
    }
    // Create new mapping
    const key = ctx.activeKey();
    const existingIdx = enforceSingleInstance(key);
    if (existingIdx >= 0) { ctx.setSelectedId(existingIdx); return; }
    const pdfX = x / sc;
    const pdfY = ((canvas.height - y) / sc);
    const w = DEFAULT_BOX.width / sc;
    const hPdf = DEFAULT_BOX.height / sc;
    const isStatic = key === 'static';
    const newMap = {
      key,
      llc: { x: pdfX, y: pdfY },
      urc: { x: pdfX + w, y: pdfY + hPdf },
      value: isStatic ? 'Static Text' : key,
      page: ctx.pageIndex(),
      format: parseCurrentStyle()
    } as any;
    ctx.setMappings(m => [...m, newMap]);
    // Auto select newly created mapping (changed per user request)
    ctx.setSelectedId(ctx.mappings().length); // new index (post append length-1) but reactive queue means we can approximate
    ctx.runtime.scheduleOverlays?.();
  }

  function onPointerDown(e: MouseEvent) {
    if (ctx.previewMode()) return;
    const canvas = ctx.canvasEl(); if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const sc = ctx.scale();
    const h = canvas.height;
    let clickedIndex: number | null = null;
    for (let i = ctx.mappings().length - 1; i >= 0; i--) {
      const m = ctx.mappings()[i];
      if ((m.page ?? 0) !== ctx.pageIndex()) continue;
      const bx = m.llc.x * sc;
      const byB = m.llc.y * sc;
      const bw = (m.urc.x - m.llc.x) * sc;
      const bh = (m.urc.y - m.llc.y) * sc;
      const by = h - byB - bh;
      // Resize handle priority
      if (x >= bx + bw - RESIZE_HANDLE_SIZE && x <= bx + bw && y >= by + bh - RESIZE_HANDLE_SIZE && y <= by + bh) {
        ctx.setResizingId(i);
        ctx.runtime.boxOriginal = { llc: { ...m.llc }, urc: { ...m.urc } };
        clickedIndex = i;
        break;
      }
      if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
        ctx.setDraggingId(i);
        ctx.runtime.dragOffset = { dx: x - bx, dy: y - by };
        ctx.runtime.boxOriginal = { llc: { ...m.llc }, urc: { ...m.urc } };
        clickedIndex = i;
        break;
      }
    }
    if (clickedIndex !== null) {
      // Toggle selection if clicking the already selected box without initiating drag/resize
      ctx.setSelectedId(cur => (cur === clickedIndex ? null : clickedIndex));
      return;
    }
    // Blank area pointer down: record current selection; actual deselect decision happens in click handler
    ctx.runtime.prevSelectedIdBeforeBlank = ctx.selectedId();
  }

  function updateMappingsWithThrottle(newMaps: any[]) {
    const rt = ctx.runtime;
    if (ctx.IS_TEST) {
      ctx.setMappings(newMaps);
      ctx.runtime.scheduleOverlays?.();
      return;
    }
    rt.pendingMappingsUpdate = newMaps;
    if (!rt.dragUpdateTimeout) {
      rt.dragUpdateTimeout = setTimeout(() => {
        if (rt.pendingMappingsUpdate) {
          ctx.setMappings(rt.pendingMappingsUpdate);
          rt.pendingMappingsUpdate = null;
          ctx.runtime.scheduleOverlays?.();
        }
        rt.dragUpdateTimeout = null;
      }, 16);
    }
  }

  function onPointerMove(e: MouseEvent) {
    const rt = ctx.runtime;
    if (ctx.draggingId() === null && ctx.resizingId() === null) return; // drag/resize only
    const now = Date.now();
    if (now - rt.lastPointerMoveTime < 16) return;
    rt.lastPointerMoveTime = now;
    const canvas = ctx.canvasEl(); if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const sc = ctx.scale();
    const h = canvas.height;
    const current = [...ctx.mappings()];
    const dragging = ctx.draggingId();
    const resizing = ctx.resizingId();
    const updated = current.map((m, i) => {
      if (i === dragging) {
        const off = rt.dragOffset; if (!off) return m;
        const w = m.urc.x - m.llc.x;
        const hh = m.urc.y - m.llc.y;
        const newLlX = (x - off.dx) / sc;
        const newTopY = (y - off.dy);
        const newLlY = (h - newTopY - (hh * sc)) / sc;
        return { ...m, llc: { x: newLlX, y: newLlY }, urc: { x: newLlX + w, y: newLlY + hh } };
      } else if (i === resizing) {
        const base = rt.boxOriginal; if (!base) return m;
        const newWidth = Math.max(5 / sc, (x / sc) - base.llc.x);
        const canvasYFromBottom = (canvas.height - y) / sc;
        const newHeight = Math.max(5 / sc, canvasYFromBottom - base.llc.y);
        return { ...m, llc: base.llc, urc: { x: base.llc.x + newWidth, y: base.llc.y + newHeight } };
      }
      return m;
    });
    updateMappingsWithThrottle(updated);
  }

  function onPointerUp() {
    const rt = ctx.runtime;
    if (rt.dragUpdateTimeout) {
      clearTimeout(rt.dragUpdateTimeout);
      rt.dragUpdateTimeout = null;
      if (rt.pendingMappingsUpdate) {
        ctx.setMappings(rt.pendingMappingsUpdate);
        rt.pendingMappingsUpdate = null;
      }
    }
    ctx.setDraggingId(null);
    ctx.setResizingId(null);
    rt.dragOffset = undefined;
    rt.boxOriginal = undefined;
    ctx.runtime.scheduleOverlays?.();
  }

  // Hover cursor feedback (move vs resize)
  function onHoverMove(e: MouseEvent) {
    const canvas = ctx.canvasEl(); if (!canvas) return;
    if (ctx.draggingId() !== null || ctx.resizingId() !== null) return; // active drag sets its own cursor via CSS maybe
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const sc = ctx.scale();
    const h = canvas.height;
    let cursor: string | null = null;
    for (let i = ctx.mappings().length - 1; i >= 0; i--) {
      const m = ctx.mappings()[i];
      if ((m.page ?? 0) !== ctx.pageIndex()) continue;
      const bx = m.llc.x * sc;
      const byB = m.llc.y * sc;
      const bw = (m.urc.x - m.llc.x) * sc;
      const bh = (m.urc.y - m.llc.y) * sc;
      const by = h - byB - bh;
      // Resize handle region
      if (x >= bx + bw - RESIZE_HANDLE_SIZE && x <= bx + bw && y >= by + bh - RESIZE_HANDLE_SIZE && y <= by + bh) { cursor = 'nwse-resize'; break; }
      if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) { cursor = 'move'; break; }
    }
    canvas.style.cursor = cursor || 'default';
  }

  function onHoverLeave() {
    const canvas = ctx.canvasEl(); if (canvas) canvas.style.cursor = 'default';
  }

  function removeMapping(idx: number) { ctx.setMappings(ms => ms.filter((_, i) => i !== idx)); setTimeout(() => ctx.runtime.scheduleOverlays?.(), 10); }
  function selectedMapping() { const id = ctx.selectedId(); if (id === null) return null; return ctx.mappings()[id] ?? null; }
  function updateSelectedBox(delta: any) {
    const id = ctx.selectedId(); if (id === null) return;
    ctx.setMappings(ms => ms.map((m, i) => {
      if (i !== id) return m;
      let { llc, urc } = m;
      if (delta.llc) llc = { ...llc, ...delta.llc };
      if (delta.width !== undefined) urc = { x: llc.x + delta.width, y: urc.y };
      if (delta.height !== undefined) urc = { x: urc.x, y: llc.y + delta.height };
      if (delta.page !== undefined) m.page = delta.page;
      if (delta.fontSize || delta.color) {
        const fmt = { ...(m.format || {}) } as any;
        if (delta.fontSize) fmt.fontSize = delta.fontSize;
        if (delta.color) fmt.fontColor = hexToRgb01(delta.color);
        m.format = fmt;
      }
      if (delta.value !== undefined) m.value = delta.value;
      return { ...m, llc, urc };
    }));
    ctx.runtime.scheduleOverlays?.();
  }
  function __testDragDelta(id: number, dxCanvas: number, dyCanvas: number) { const sc = ctx.scale(); if (id == null || id < 0) return; ctx.setMappings(ms => ms.map((m, i) => i !== id ? m : ({ ...m, llc: { x: m.llc.x + dxCanvas / sc, y: m.llc.y + dyCanvas / sc }, urc: { x: m.urc.x + dxCanvas / sc, y: m.urc.y + dyCanvas / sc } }))); ctx.runtime.scheduleOverlays?.(); }
  function __testResizeDelta(id: number, dwCanvas: number, dhCanvas: number) { const sc = ctx.scale(); if (id == null || id < 0) return; ctx.setMappings(ms => ms.map((m, i) => i !== id ? m : ({ ...m, urc: { x: m.urc.x + dwCanvas / sc, y: m.urc.y + dhCanvas / sc } }))); ctx.runtime.scheduleOverlays?.(); }
  return { handleCanvasClick, onPointerDown, onPointerMove, onPointerUp, onHoverMove, onHoverLeave, removeMapping, selectedMapping, updateSelectedBox, __testDragDelta, __testResizeDelta };
}

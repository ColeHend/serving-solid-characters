/**
 * Single source of truth for the sheet coordinate system.
 *
 * CONVENTION (locked — do not duplicate or re-flip elsewhere):
 *  - Stored `(x, y)` is the text **baseline-left** anchor, in **PDF points**,
 *    with a **bottom-left origin** (pdf-lib's native `drawText` space).
 *  - The Y-flip between screen space (top-left origin, pixels) and PDF space
 *    happens EXACTLY ONCE, here, in `screenToPdf` / `pdfToScreen`.
 *  - The generator (`generateSheetPdf`) does NO extra flip: it passes stored
 *    `(x, y)` straight to `drawText`.
 *  - Editor chips anchor their bottom-left at `pdfToScreen(x, y)` (CSS
 *    `translateY(-100%)`) so the on-screen chip baseline matches `drawText`.
 *
 * `scale` is screen-pixels per PDF-point (e.g. a 150dpi PNG → ~2.0833; the
 * editor passes its current zoom). Coordinates are stored DPI-independently in
 * points, so changing the backdrop resolution or zoom never moves a placement.
 */

export const PDF_PAGE_W = 612;
export const PDF_PAGE_H = 792;
export const PAGE_COUNT = 2;
export const DEFAULT_FONT_SIZE = 10;

/** Clamp `n` into the inclusive range [lo, hi]. */
export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi);
}

/**
 * Screen pixels (top-left origin) → PDF points (bottom-left origin, baseline-left).
 * The lone Y-flip lives here. Result is clamped to the page box.
 */
export function screenToPdf(px: number, py: number, scale: number): { x: number; y: number } {
  return {
    x: clamp(px / scale, 0, PDF_PAGE_W),
    y: clamp(PDF_PAGE_H - py / scale, 0, PDF_PAGE_H),
  };
}

/**
 * PDF points (bottom-left origin, baseline-left) → screen CSS offset (top-left origin).
 * Inverse of `screenToPdf` (modulo clamping). Chips position their bottom-left here.
 */
export function pdfToScreen(x: number, y: number, scale: number): { left: number; top: number } {
  return {
    left: x * scale,
    top: (PDF_PAGE_H - y) * scale,
  };
}

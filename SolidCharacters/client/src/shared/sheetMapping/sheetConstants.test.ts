import { describe, it, expect } from 'vitest';
import {
  PDF_PAGE_W,
  PDF_PAGE_H,
  clamp,
  screenToPdf,
  pdfToScreen,
} from './sheetConstants';

// Golden tests for the lone Y-flip. These lock the coordinate convention:
// screen pixels (top-left origin) <-> PDF points (bottom-left origin, baseline-left).

describe('clamp', () => {
  it('passes through values inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it('clamps below the floor and above the ceiling', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });
  it('respects exact bounds', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('screenToPdf', () => {
  it('flips Y: screen top (py=0) -> PDF top (y=PAGE_H)', () => {
    expect(screenToPdf(0, 0, 1)).toEqual({ x: 0, y: PDF_PAGE_H });
  });
  it('flips Y: screen bottom (py=PAGE_H) -> PDF bottom (y=0)', () => {
    expect(screenToPdf(PDF_PAGE_W, PDF_PAGE_H, 1)).toEqual({ x: PDF_PAGE_W, y: 0 });
  });
  it('divides pixel coords by scale before flipping', () => {
    // 1224px / 2 = 612pt across; 1584px / 2 = 792px from top -> y = 0.
    expect(screenToPdf(1224, 1584, 2)).toEqual({ x: PDF_PAGE_W, y: 0 });
  });
  it('clamps out-of-page pixels into the page box', () => {
    expect(screenToPdf(-50, -50, 1)).toEqual({ x: 0, y: PDF_PAGE_H });
    expect(screenToPdf(10_000, 10_000, 1)).toEqual({ x: PDF_PAGE_W, y: 0 });
  });
});

describe('pdfToScreen', () => {
  it('maps the corners back to screen offsets', () => {
    expect(pdfToScreen(0, PDF_PAGE_H, 1)).toEqual({ left: 0, top: 0 });
    expect(pdfToScreen(PDF_PAGE_W, 0, 1)).toEqual({ left: PDF_PAGE_W, top: PDF_PAGE_H });
  });
  it('multiplies point coords by scale', () => {
    expect(pdfToScreen(100, PDF_PAGE_H, 2)).toEqual({ left: 200, top: 0 });
  });
});

describe('round-trip', () => {
  const corners = [
    [0, 0],
    [PDF_PAGE_W, PDF_PAGE_H],
    [0, PDF_PAGE_H],
    [PDF_PAGE_W, 0],
  ];

  it('screenToPdf -> pdfToScreen returns the original pixel for each corner at scale 1', () => {
    for (const [px, py] of corners) {
      const { x, y } = screenToPdf(px, py, 1);
      const { left, top } = pdfToScreen(x, y, 1);
      expect({ left, top }).toEqual({ left: px, top: py });
    }
  });

  it('is scale-invariant: same PDF point regardless of zoom', () => {
    // The same physical spot at two zoom levels resolves to the same PDF point.
    const atScale1 = screenToPdf(306, 396, 1);
    const atScale2 = screenToPdf(612, 792, 2);
    expect(atScale1).toEqual(atScale2);
    expect(atScale1).toEqual({ x: 306, y: PDF_PAGE_H - 396 });
  });

  it('pdfToScreen -> screenToPdf recovers an interior point at scale 2', () => {
    const x = 137.5;
    const y = 642.25;
    const { left, top } = pdfToScreen(x, y, 2);
    expect(screenToPdf(left, top, 2)).toEqual({ x, y });
  });
});

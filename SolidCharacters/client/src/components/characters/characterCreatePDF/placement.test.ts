import { describe, it, expect } from 'vitest';
import { PDF_PAGE_H, PDF_PAGE_W, PlacedField } from '../../../shared/sheetMapping';
import {
  DEFAULT_FIELD_COLOR,
  DropGeometry,
  MIN_TABLE_COL_W,
  movedTableTop,
  movedTableX,
  placedAtCenter,
  placedFromPalette,
  resizedTableWidth,
} from './placement';

describe('placedFromPalette default color', () => {
  it('gives a brand-new field the default (black) color', () => {
    const field = placedFromPalette('name', undefined, {
      rect: { left: 0, top: 0, width: 612 },
      dragStart: { x: 100, y: 200 },
      delta: { x: 0, y: 0 },
      pageIndex: 0,
      fallbackScale: 1,
    });
    expect(field.color).toBe(DEFAULT_FIELD_COLOR);
  });

  it('preserves an existing field color when re-homing', () => {
    const existing: PlacedField = {
      fieldKey: 'name', pageIndex: 0, x: 0, y: 0, fontSize: 10, font: 'Helvetica', align: 'left', color: '#ff0000',
    };
    const field = placedFromPalette('name', existing, {
      rect: { left: 0, top: 0, width: 612 },
      dragStart: { x: 10, y: 20 },
      delta: { x: 0, y: 0 },
      pageIndex: 1,
      fallbackScale: 1,
    });
    expect(field.color).toBe('#ff0000');
    expect(field.pageIndex).toBe(1);
  });
});

describe('placedAtCenter (tap-to-add)', () => {
  it('drops a new field at the page center with default styling', () => {
    const field = placedAtCenter('str', 1);
    expect(field.fieldKey).toBe('str');
    expect(field.pageIndex).toBe(1);
    expect(field.x).toBe(PDF_PAGE_W / 2);
    expect(field.y).toBe(PDF_PAGE_H / 2);
    expect(field.fontSize).toBe(10);
    expect(field.font).toBe('Helvetica');
    expect(field.align).toBe('left');
    expect(field.color).toBe(DEFAULT_FIELD_COLOR);
  });

  it('returns an already-placed field unchanged (re-tap selects, never yanks)', () => {
    const existing: PlacedField = {
      fieldKey: 'str', pageIndex: 0, x: 40, y: 700, fontSize: 12, font: 'Courier', align: 'right', color: '#00ff00',
    };
    expect(placedAtCenter('str', 1, existing)).toBe(existing);
  });
});

describe('table guide drop math', () => {
  const g = (dx: number, dy: number, width = 612): DropGeometry => ({
    rect: { left: 0, top: 0, width },
    dragStart: { x: 0, y: 0 },
    delta: { x: dx, y: dy },
    pageIndex: 1,
    fallbackScale: 1,
  });

  it('movedTableX adds delta.x in points (scale from rect width) and clamps to the page', () => {
    expect(movedTableX(100, g(40, 0, 1224))).toBe(120); // 40px ÷ scale 2
    expect(movedTableX(0, g(-50, 0))).toBe(0); // clamp at left edge
    expect(movedTableX(PDF_PAGE_W, g(50, 0))).toBe(PDF_PAGE_W); // clamp at right edge
  });

  it('resizedTableWidth grows/shrinks width, floored and kept on-page', () => {
    expect(resizedTableWidth(100, 50, g(20, 0))).toBe(70);
    expect(resizedTableWidth(100, 50, g(-1000, 0))).toBe(MIN_TABLE_COL_W); // floor
    expect(resizedTableWidth(100, 50, g(10000, 0))).toBe(PDF_PAGE_W - 100); // can't extend past page right
  });

  it('movedTableTop adds delta.y (TOP-DOWN) — opposite of movedPlaced (bottom-up)', () => {
    expect(movedTableTop(200, g(0, 30))).toBe(230); // dragging down increases distance-from-top
    expect(movedTableTop(200, g(0, -50))).toBe(150); // dragging up decreases it
    expect(movedTableTop(10, g(0, -100))).toBe(0); // clamp at top
    expect(movedTableTop(PDF_PAGE_H, g(0, 50))).toBe(PDF_PAGE_H); // clamp at bottom
  });
});

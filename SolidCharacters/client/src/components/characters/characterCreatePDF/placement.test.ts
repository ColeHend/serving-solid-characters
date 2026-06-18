import { describe, it, expect } from 'vitest';
import { PDF_PAGE_H, PDF_PAGE_W, PlacedField } from '../../../shared/sheetMapping';
import { DEFAULT_FIELD_COLOR, placedAtCenter, placedFromPalette } from './placement';

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

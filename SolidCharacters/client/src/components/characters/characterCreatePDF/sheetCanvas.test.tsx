import { describe, it, expect } from 'vitest';
import { createSignal } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { DragDropProvider } from '../../../shared/dnd';
import { PDF_PAGE_H, PlacedField, SheetTemplate } from '../../../shared/sheetMapping';
import { defaultAttackCantripConfig, defaultSpellTableConfig } from '../../../shared/sheetMapping/pdf/spellTable';
import { movedPlaced, placedFromPalette } from './placement';
import { SheetCanvas } from './sheetCanvas';

describe('placement math (drop → flipped PDF point)', () => {
  it('palette drop stores the Y-flipped point at the release pointer', () => {
    const field = placedFromPalette('name', undefined, {
      rect: { left: 0, top: 0, width: 612 },
      dragStart: { x: 100, y: 200 },
      delta: { x: 0, y: 0 },
      pageIndex: 0,
      fallbackScale: 1,
    });
    expect(field.x).toBe(100);
    expect(field.y).toBe(PDF_PAGE_H - 200); // 592 — the lone Y-flip
    expect(field.pageIndex).toBe(0);
    expect(field.fontSize).toBe(10);
  });

  it('derives scale from the overlay rect width (zoom 2)', () => {
    const field = placedFromPalette('str', undefined, {
      rect: { left: 0, top: 0, width: 1224 },
      dragStart: { x: 200, y: 400 },
      delta: { x: 0, y: 0 },
      pageIndex: 1,
      fallbackScale: 1,
    });
    expect(field.x).toBe(100); // 200px / scale 2
    expect(field.y).toBe(PDF_PAGE_H - 200); // (400px / 2) flipped
    expect(field.pageIndex).toBe(1);
  });

  it('moving a placed field applies delta in points with screen-Y inverted', () => {
    const start: PlacedField = { fieldKey: 'name', pageIndex: 0, x: 100, y: 500, fontSize: 10, font: 'Helvetica', align: 'left' };
    const moved = movedPlaced(start, {
      rect: { left: 0, top: 0, width: 1224 },
      dragStart: { x: 0, y: 0 },
      delta: { x: 50, y: -30 },
      pageIndex: 0,
      fallbackScale: 1,
    });
    expect(moved.x).toBe(125); // 100 + 50/2
    expect(moved.y).toBe(515); // 500 - (-30)/2
  });
});

describe('SheetCanvas render', () => {
  it('renders only the active page placements', () => {
    const template: SheetTemplate = {
      templateId: 'default',
      name: 't',
      version: 1,
      fields: [
        { fieldKey: 'name', pageIndex: 0, x: 100, y: 700, fontSize: 10, font: 'Helvetica', align: 'left' },
        { fieldKey: 'str', pageIndex: 1, x: 50, y: 600, fontSize: 10, font: 'Helvetica', align: 'left' },
      ],
      updatedAt: 0,
    };
    const [page] = createSignal(0);
    const { container } = render(() => (
      <DragDropProvider>
        <SheetCanvas
          activePage={page}
          template={() => template}
          zoom={() => 1}
          selectedFieldKey={() => null}
          onSelect={() => {}}
          onEdit={() => {}}
          onRemove={() => {}}
          selectedTable={() => null}
          onSelectTable={() => {}}
        />
      </DragDropProvider>
    ));
    expect(container.textContent).toContain('Character Name'); // page-0 field
    expect(container.textContent).not.toContain('Strength Score'); // page-1 field hidden
  });

  it('renders spell-table column + marker guides on page 2', () => {
    const template: SheetTemplate = {
      templateId: 'default',
      name: 't',
      version: 4,
      fields: [],
      spellTable: defaultSpellTableConfig(),
      attackCantripTable: defaultAttackCantripConfig(),
      updatedAt: 0,
    };
    const [page] = createSignal(1);
    const { container } = render(() => (
      <DragDropProvider>
        <SheetCanvas
          activePage={page}
          template={() => template}
          zoom={() => 1}
          selectedFieldKey={() => null}
          onSelect={() => {}}
          onEdit={() => {}}
          onRemove={() => {}}
          selectedTable={() => null}
          onSelectTable={() => {}}
        />
      </DragDropProvider>
    ));
    expect(container.textContent).toContain('Casting Time'); // a column-guide label
    expect(container.textContent).toContain('Conc.'); // a marker-guide label
  });
});

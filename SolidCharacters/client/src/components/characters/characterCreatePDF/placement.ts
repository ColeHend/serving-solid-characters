import { DEFAULT_FONT_SIZE, PDF_PAGE_H, PDF_PAGE_W, PlacedField, clamp, screenToPdf } from '../../../shared/sheetMapping';

/**
 * Pure drop→placement math, extracted from the editor shell so it is unit
 * testable. `scale` (screen px per PDF point) is derived from the overlay rect
 * width so it always matches the actually-rendered page size; the lone Y-flip is
 * delegated to `screenToPdf` (see `sheetConstants.ts`).
 */
export interface DropGeometry {
  rect: { left: number; top: number; width: number };
  /** Client pointer position captured at grab (pointerdown). */
  dragStart: { x: number; y: number };
  /** Accumulated drag movement in client space. */
  delta: { x: number; y: number };
  pageIndex: number;
  /** Used only if the overlay rect has zero width (unmeasured). */
  fallbackScale: number;
}

const scaleFromRect = (g: DropGeometry): number => g.rect.width / PDF_PAGE_W || g.fallbackScale;

/** New/re-homed placement from a palette drop: final pointer relative to overlay, Y-flipped. */
export function placedFromPalette(fieldKey: string, existing: PlacedField | undefined, g: DropGeometry): PlacedField {
  const scale = scaleFromRect(g);
  const { x, y } = screenToPdf(g.dragStart.x + g.delta.x - g.rect.left, g.dragStart.y + g.delta.y - g.rect.top, scale);
  return {
    ...(existing ?? { fieldKey, fontSize: DEFAULT_FONT_SIZE, font: 'Helvetica', align: 'left' }),
    fieldKey,
    pageIndex: g.pageIndex,
    x,
    y,
  };
}

/** Move an existing placed field by the drag delta (points = px / scale; screen-Y inverted). */
export function movedPlaced(field: PlacedField, g: DropGeometry): PlacedField {
  const scale = scaleFromRect(g);
  return {
    ...field,
    x: clamp(field.x + g.delta.x / scale, 0, PDF_PAGE_W),
    y: clamp(field.y - g.delta.y / scale, 0, PDF_PAGE_H),
  };
}

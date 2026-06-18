import { DEFAULT_FONT_SIZE, PDF_PAGE_H, PDF_PAGE_W, PlacedField, clamp, screenToPdf } from '../../../shared/sheetMapping';

/** Default text color for a freshly placed field — black so it is always visible. */
export const DEFAULT_FIELD_COLOR = '#000000';

/** Shared defaults for a brand-new placement (font/size/align/color). */
const newFieldDefaults = (fieldKey: string): Pick<PlacedField, 'fieldKey' | 'fontSize' | 'font' | 'align' | 'color'> => ({
  fieldKey,
  fontSize: DEFAULT_FONT_SIZE,
  font: 'Helvetica',
  align: 'left',
  color: DEFAULT_FIELD_COLOR,
});

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
    ...(existing ?? newFieldDefaults(fieldKey)),
    fieldKey,
    pageIndex: g.pageIndex,
    x,
    y,
  };
}

/**
 * Tap-to-add placement (mobile-friendly, no drag): a new field dropped at the
 * page center. If the field is already placed (`existing`), it is returned
 * unchanged so re-tapping selects it instead of yanking it to the center.
 */
export function placedAtCenter(fieldKey: string, pageIndex: number, existing?: PlacedField): PlacedField {
  if (existing) return existing;
  return {
    ...newFieldDefaults(fieldKey),
    pageIndex,
    x: PDF_PAGE_W / 2,
    y: PDF_PAGE_H / 2,
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

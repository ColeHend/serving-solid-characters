import {
  DEFAULT_FONT_SIZE,
  PDF_PAGE_H,
  PDF_PAGE_W,
  PlacedField,
  STATIC_FIELD_DEFAULT_TEXT,
  STATIC_FIELD_PREFIX,
  clamp,
  screenToPdf,
} from '../../../shared/sheetMapping';

/** Default text color for a freshly placed field — black so it is always visible. */
export const DEFAULT_FIELD_COLOR = '#000000';

let staticCounter = 0;

/**
 * A fresh, unique `fieldKey` for a static-text field. Static fields dedupe in the
 * store by key (one placement per key), so each new label needs its own key.
 * Prefers `crypto.randomUUID`; falls back to a monotonic counter where it is
 * unavailable (keeps the helper safe in non-browser/older test environments).
 */
export function newStaticKey(): string {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${staticCounter++}-${PDF_PAGE_W}`;
  return `${STATIC_FIELD_PREFIX}${id}`;
}

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

/**
 * New/re-homed placement from a palette drop: final pointer relative to overlay,
 * Y-flipped. `seed` carries extra defaults for a BRAND-NEW field (e.g. a static
 * field's `renderMode`/`staticText`); it is ignored when re-homing an `existing`
 * placement so its tuned props survive the move.
 */
export function placedFromPalette(
  fieldKey: string,
  existing: PlacedField | undefined,
  g: DropGeometry,
  seed?: Partial<PlacedField>,
): PlacedField {
  const scale = scaleFromRect(g);
  const { x, y } = screenToPdf(g.dragStart.x + g.delta.x - g.rect.left, g.dragStart.y + g.delta.y - g.rect.top, scale);
  return {
    ...(existing ?? { ...newFieldDefaults(fieldKey), ...seed }),
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

/** Tap-to-add a brand-new static-text field (fresh unique key) at the page center. */
export function placedStaticAtCenter(pageIndex: number): PlacedField {
  return {
    ...newFieldDefaults(newStaticKey()),
    pageIndex,
    x: PDF_PAGE_W / 2,
    y: PDF_PAGE_H / 2,
    renderMode: 'static',
    staticText: STATIC_FIELD_DEFAULT_TEXT,
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

/** Smallest a table column may be dragged to (points) — keeps a grabbable sliver. */
export const MIN_TABLE_COL_W = 4;

/** New page-left x for a horizontally-dragged table column / marker (points = px / scale). */
export function movedTableX(x: number, g: DropGeometry): number {
  return clamp(x + g.delta.x / scaleFromRect(g), 0, PDF_PAGE_W);
}

/** New column clip width from a right-edge resize drag; floored and kept on-page. */
export function resizedTableWidth(x: number, width: number, g: DropGeometry): number {
  return clamp(width + g.delta.x / scaleFromRect(g), MIN_TABLE_COL_W, PDF_PAGE_W - x);
}

/**
 * New `firstRowTopFromTop` for a vertical table-move drag. Unlike {@link movedPlaced}
 * (bottom-up `y`, subtracts the delta), table row anchors are measured TOP-DOWN
 * from the page top, so a downward screen drag (+delta.y) INCREASES the value.
 */
export function movedTableTop(topFromTop: number, g: DropGeometry): number {
  return clamp(topFromTop + g.delta.y / scaleFromRect(g), 0, PDF_PAGE_H);
}

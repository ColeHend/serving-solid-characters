/**
 * Versioned, template-keyed mapping schema for the character-sheet field mapper.
 *
 * A {@link SheetTemplate} binds character data field keys to coordinates on the
 * shipped flat sheet PDF. `(x, y)` is the text baseline-left anchor in PDF
 * points (bottom-left origin) — see `sheetConstants.ts` for the single Y-flip.
 */

/** Bump when {@link PlacedField}/{@link SheetTemplate} shape changes → triggers a reseed. */
export const MAPPING_SCHEMA_VERSION = 1;

/** StandardFonts only (no fontkit / custom TTF available). */
export type SheetFontName = 'Helvetica' | 'TimesRoman' | 'Courier';

export type TextAlign = 'left' | 'center' | 'right';

export interface PlacedField {
  /** Key into `characterToSheetValues()` output and `SHEET_FIELD_DEFS`. */
  fieldKey: string;
  /** 0 | 1 — which page of the 2-page sheet. */
  pageIndex: number;
  /** PDF points, bottom-left origin, baseline-left. */
  x: number;
  y: number;
  /** Point size; default 10. */
  fontSize: number;
  font: SheetFontName;
  align: TextAlign;
  /** Optional wrap width in points. When set, text wraps to multiple lines. */
  maxWidth?: number;
  /** Text color as a `#rrggbb` hex string. Defaults to black (`#000000`) when unset. */
  color?: string;
}

export interface SheetTemplate {
  /** 'default' for the shipped sheet; other ids reserved for future templates. */
  templateId: string;
  name: string;
  /** Always equals {@link MAPPING_SCHEMA_VERSION} for a valid record. */
  version: number;
  fields: PlacedField[];
  updatedAt: number;
}

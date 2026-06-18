/**
 * Versioned, template-keyed mapping schema for the character-sheet field mapper.
 *
 * A {@link SheetTemplate} binds character data field keys to coordinates on the
 * shipped flat sheet PDF. `(x, y)` is the text baseline-left anchor in PDF
 * points (bottom-left origin) — see `sheetConstants.ts` for the single Y-flip.
 */

/**
 * Bump when {@link PlacedField}/{@link SheetTemplate} shape changes, OR when the
 * shipped {@link SheetTemplate} default data changes and existing cached records
 * should be reseeded → triggers a reseed in `mappingStore` (see R6).
 *
 * v2: Phase 7 replaced the hand-seeded starter placements with the full
 * pixel-calibrated default mapping.
 * v3: removed the wrapped `spellsPrepared` Name-column placement; the spell
 * table is now drawn directly by `generateSheetPdf` (structured rows, sorted,
 * with overflow pages). Bumped so cached v2 templates reseed and drop the stale
 * placement (otherwise the Name column double-renders).
 * v4: page-1 attack-cantrip and page-2 spell table geometry are now persisted
 * (`spellTable` / `attackCantripTable`) and editable on the mapping screen.
 * Bumped so cached v3 records reseed and gain the default table configs.
 */
export const MAPPING_SCHEMA_VERSION = 4;

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

/**
 * One left-anchored text column of a printed table: `x` is the left edge and
 * `maxWidth` the clip/ellipsis width — both in PDF points, page-left origin.
 */
export interface SpellTextCol {
  x: number;
  maxWidth: number;
}

/**
 * Geometry shared by both printed tables. Row anchors are TOP-DOWN: distance
 * from the PAGE TOP to the first row's text-top, converted to a pdf-lib
 * bottom-left baseline at draw time (see `rowBaseline` in `pdf/spellTable.ts`).
 */
export interface TableRowGeometry {
  pageIndex: number;
  pageHeight: number;
  firstRowTopFromTop: number;
  rowPitch: number;
  rowAscent: number;
  fontSize: number;
  font: SheetFontName;
}

/** Editable geometry of the page-2 "CANTRIPS & PREPARED SPELLS" table. */
export interface SpellTableConfig extends TableRowGeometry {
  rowsPerPage: number;
  cols: { level: SpellTextCol; name: SpellTextCol; castingTime: SpellTextCol; range: SpellTextCol };
  /** CENTER x of each ◇ checkbox; the glyph is drawn center-anchored on these. */
  markers: {
    concentration: { x: number };
    ritual: { x: number };
    material: { x: number };
    glyph: string;
    fontSize: number;
    yAdjust: number;
  };
}

/** Editable geometry of the page-1 "WEAPONS & DAMAGE CANTRIPS" box. */
export interface AttackCantripConfig extends TableRowGeometry {
  maxRows: number;
  cols: { name: SpellTextCol; detail: SpellTextCol };
}

export interface SheetTemplate {
  /** 'default' for the shipped sheet; other ids reserved for future templates. */
  templateId: string;
  name: string;
  /** Always equals {@link MAPPING_SCHEMA_VERSION} for a valid record. */
  version: number;
  fields: PlacedField[];
  /** Page-2 spell table geometry. Optional so cached v3 records still type-check. */
  spellTable?: SpellTableConfig;
  /** Page-1 attack-cantrip box geometry. Optional so cached v3 records still type-check. */
  attackCantripTable?: AttackCantripConfig;
  updatedAt: number;
}

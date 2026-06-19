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
 * v5: split the merged `features` blob into three `renderMode: 'featureList'`
 * fields (`classFeatures`/`speciesTraits`/`feats`) that draw name + truncated
 * description in columns; added `renderMode: 'static'` user-text fields; and
 * relocated resistances/vulnerabilities/immunities out of the species box.
 * Bumped so cached v4 records reseed onto the new default layout.
 * v6: redefined `featureList` `(x, y)` to be the BOX TOP-LEFT corner (the list
 * flows DOWN to `y - boxHeight`) instead of the first line's baseline, and
 * recalibrated the three feature boxes to the printed rules. Bumped so cached v5
 * records reseed onto the corrected coordinates.
 * v7: filled the EQUIPMENT TRAINING & PROFICIENCIES box — added per-category armor
 * checkbox marks (`armorLight`/`armorMedium`/`armorHeavy`/`armorShields`) and
 * `weaponProficiencies`/`toolProficiencies` placements, dropped the unused combined
 * `otherProficiencies` placement, and moved resistances/vulnerabilities/immunities
 * inside the box along its bottom. Bumped so cached v6 records reseed.
 */
export const MAPPING_SCHEMA_VERSION = 7;

/** StandardFonts only (no fontkit / custom TTF available). */
export type SheetFontName = 'Helvetica' | 'TimesRoman' | 'Courier';

export type TextAlign = 'left' | 'center' | 'right';

/**
 * How a placement turns into PDF text:
 *  - `'text'` (default/undefined): draw the character value `values[fieldKey]`.
 *  - `'featureList'`: draw the `FeatureDetail[]` for `fieldKey` as columns of
 *    bold name + ellipsis-truncated description (see `drawFeatureList`).
 *  - `'static'`: draw the field's own `staticText` verbatim (no data binding).
 */
export type SheetRenderMode = 'text' | 'featureList' | 'static';

export interface PlacedField {
  /** Key into `characterToSheetValues()` output and `SHEET_FIELD_DEFS`. */
  fieldKey: string;
  /** 0 | 1 — which page of the 2-page sheet. */
  pageIndex: number;
  /**
   * PDF points, bottom-left origin. For `'text'`/`'static'` fields this is the
   * text baseline-left anchor. For `'featureList'` fields it is the BOX TOP-LEFT
   * corner — the list flows DOWN from here to `y - boxHeight` (see `boxHeight`).
   */
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
  /** Render strategy; undefined ⇒ `'text'` (back-compat with pre-v5 records). */
  renderMode?: SheetRenderMode;
  // ── `featureList`-only layout (ignored by other modes) ──
  /** Box height in points; the list flows DOWN from the box top `y` and stops at `y - boxHeight`. Default 120. */
  boxHeight?: number;
  /** Number of columns the features flow through (1–3). Default 2. */
  columns?: number;
  /** Gap between columns in points. Default 12. */
  columnGap?: number;
  /** Truncate each description to this many chars (then `…`). Default 80; 0 ⇒ none. */
  descMaxChars?: number;
  /** Draw descriptions beneath each name. Default true. */
  showDescriptions?: boolean;
  // ── `static`-only ──
  /** Literal text drawn verbatim for `renderMode: 'static'` fields. */
  staticText?: string;
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

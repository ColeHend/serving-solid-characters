import { Character } from '../../../models/character.model';
import { useDnDSpells } from '../../customHooks/dndInfo/info/all/spells';
import { AttackCantripConfig, SpellTableConfig } from '../sheetMapping.types';

/**
 * Structured spell-row data for the page-2 "CANTRIPS & PREPARED SPELLS" table.
 *
 * The character only stores `{ name, prepared }`; the per-row detail (level,
 * casting time, range, and the concentration / ritual / material markers) is
 * looked up by name from the SRD spell reference (`useDnDSpells`). This module is
 * pdf-lib-free — it produces the data + geometry; `generateSheetPdf` draws it.
 */

/** The element type of the SRD spell list, inferred so no import path is hard-coded. */
type RefSpell = ReturnType<ReturnType<typeof useDnDSpells>>[number];

export interface SpellRow {
  /** Numeric spell level; 0 for cantrips. */
  level: number;
  name: string;
  castingTime: string;
  range: string;
  concentration: boolean;
  ritual: boolean;
  material: boolean;
  /** Damage type (e.g. "fire"); empty for non-damaging spells. Drives the page-1 attack box. */
  damageType: string;
}

/**
 * Join a character's spells with the SRD reference, map to {@link SpellRow}, and
 * sort by level (numeric, ascending) then name (case-insensitive). ALL of the
 * character's spells are listed — cantrips are always included regardless of
 * `prepared`. A name with no reference match is kept (level 0, blank columns, no
 * markers) rather than dropped, so homebrew / typo'd spells still appear.
 *
 * Safe to call headless (outside a Solid owner): `useDnDSpells()()` reads
 * module-level signals and is wrapped so an empty / unavailable reference yields
 * name-only rows instead of throwing.
 */
export function spellTableRows(char: Character | undefined): SpellRow[] {
  const chosen = char?.spells ?? [];
  if (!chosen.length) return [];

  let ref: RefSpell[] = [];
  try {
    ref = useDnDSpells()() ?? [];
  } catch {
    ref = [];
  }

  const byName = new Map<string, RefSpell>();
  for (const s of ref) if (s?.name) byName.set(s.name.trim().toLowerCase(), s);

  const rows: SpellRow[] = chosen
    .filter((cs) => cs?.name)
    .map((cs) => {
      const m = byName.get(cs.name.trim().toLowerCase());
      const lvl = m ? parseInt(m.level, 10) : NaN;
      return {
        level: Number.isFinite(lvl) ? lvl : 0,
        name: cs.name,
        castingTime: m?.castingTime ?? '',
        range: m?.range ?? '',
        concentration: !!m?.concentration,
        ritual: !!m?.ritual,
        material: !!m?.isMaterial,
        damageType: m?.damageType ?? '',
      };
    });

  rows.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  return rows;
}

/**
 * Geometry of the page-2 spell table, bbox-calibrated from the shipped template
 * (`pdftotext -bbox`). Coordinates are PDF points; row anchors are expressed as
 * distance from the PAGE TOP (page height 792) and converted to pdf-lib's
 * bottom-left baseline at draw time (see `rowBaseline`).
 */
export const SPELL_TABLE: SpellTableConfig = {
  /** Page index of the printed spell table (page 2). */
  pageIndex: 1,
  pageHeight: 792,
  rowsPerPage: 30,
  /** Constant vertical pitch between rows: (762.4 − 194.7) / 29 ≈ 19.57. */
  rowPitch: 19.57,
  /** Text-top (from page top) of the first data row's C/R/M markers. */
  firstRowTopFromTop: 194.7,
  /** Approx cap ascent added to a row's text-top to reach the shared baseline. */
  rowAscent: 7,
  fontSize: 8,
  font: 'Helvetica' as const,

  /** Left-anchored text columns (x = left edge, from page left). */
  cols: {
    level: { x: 19.2, maxWidth: 18 },
    name: { x: 42.1, maxWidth: 110 }, // Name (42) → Casting Time (157), minus a gap
    castingTime: { x: 156.9, maxWidth: 40 },
    range: { x: 198.9, maxWidth: 45 },
  },

  /**
   * CENTER x of each ◇ checkbox (pixel-measured from the blank template — the ◇
   * is a vector glyph, not extractable text). The mark is drawn center-anchored
   * on these. `yAdjust` nudges it down to sit on the diamond's vertical middle.
   * 'X' is WinAnsi-safe.
   */
  markers: {
    concentration: { x: 245.0 },
    ritual: { x: 266.3 },
    material: { x: 287.9 },
    glyph: 'X',
    fontSize: 9,
    yAdjust: 1.2,
  },
  // Notes column (xMin ≈ 313.6) intentionally left blank — no per-spell notes in the model.
};

/** One-line visual-calibration nudge added to every row baseline (points). */
export const BASELINE_FUDGE = 0;

/**
 * The shared baseline (pdf-lib bottom-left Y) for data row `r` (0-based within a
 * page). Cells and markers share this baseline so they line up vertically.
 * `cfg` defaults to {@link SPELL_TABLE} so existing callers stay unchanged; the
 * editor passes the template's persisted (possibly retuned) config.
 */
export function rowBaseline(r: number, cfg: SpellTableConfig = SPELL_TABLE): number {
  const topFromTop = cfg.firstRowTopFromTop + r * cfg.rowPitch;
  return cfg.pageHeight - (topFromTop + cfg.rowAscent + BASELINE_FUDGE);
}

/** A fresh deep copy of the default spell-table config (no shared nested refs). */
export function defaultSpellTableConfig(): SpellTableConfig {
  return {
    ...SPELL_TABLE,
    cols: {
      level: { ...SPELL_TABLE.cols.level },
      name: { ...SPELL_TABLE.cols.name },
      castingTime: { ...SPELL_TABLE.cols.castingTime },
      range: { ...SPELL_TABLE.cols.range },
    },
    markers: {
      ...SPELL_TABLE.markers,
      concentration: { ...SPELL_TABLE.markers.concentration },
      ritual: { ...SPELL_TABLE.markers.ritual },
      material: { ...SPELL_TABLE.markers.material },
    },
  };
}

/**
 * Abbreviate a casting-time string to fit the narrow column, e.g.
 * "1 Bonus Action" → "1 BA", "1 Reaction" → "1 Rxn", "1 Action" → "1 A",
 * "10 Minutes" → "10 min", "8 Hours" → "8 hr". Case-insensitive; leaves
 * anything unrecognised untouched (the renderer still ellipsis-truncates).
 */
export function abbrevCastingTime(s: string): string {
  return s
    .replace(/bonus action/gi, 'BA')
    .replace(/reaction/gi, 'Rxn')
    .replace(/action/gi, 'A')
    .replace(/minutes?/gi, 'min')
    .replace(/hours?/gi, 'hr')
    .trim();
}

/** Split rows into pages of `perPage` (default 30). Empty input → no pages. */
export function chunkRows(rows: SpellRow[], perPage = SPELL_TABLE.rowsPerPage): SpellRow[][] {
  if (!rows.length) return [];
  const out: SpellRow[][] = [];
  for (let i = 0; i < rows.length; i += perPage) out.push(rows.slice(i, i + perPage));
  return out;
}

/**
 * The attack/damage cantrips for the page-1 "WEAPONS & DAMAGE CANTRIPS" box:
 * level-0 spells that deal damage (have a `damageType`, e.g. Fire Bolt). Input
 * is the already-sorted {@link spellTableRows} output, so order is preserved.
 */
export function attackCantrips(rows: SpellRow[]): SpellRow[] {
  return rows.filter((r) => r.level === 0 && !!r.damageType);
}

/**
 * Geometry of the page-1 "WEAPONS & DAMAGE CANTRIPS" box. Column x are
 * bbox-derived; the row anchors (no printed glyphs to measure) are calibrated
 * visually — tune `firstRowTopFromTop` / `rowPitch` against a rendered export.
 */
export const ATTACK_CANTRIP_TABLE: AttackCantripConfig = {
  pageIndex: 0,
  pageHeight: 792,
  maxRows: 6,
  firstRowTopFromTop: 207,
  rowPitch: 15.3,
  rowAscent: 7,
  fontSize: 8,
  font: 'Helvetica' as const,
  cols: {
    name: { x: 217, maxWidth: 120 },
    detail: { x: 345, maxWidth: 120 }, // "Attack Bonus / DC, Damage & Type"
  },
};

/** Shared baseline (pdf-lib bottom-left Y) for attack-cantrip row `r`. */
export function attackCantripBaseline(r: number, cfg: AttackCantripConfig = ATTACK_CANTRIP_TABLE): number {
  return cfg.pageHeight - (cfg.firstRowTopFromTop + r * cfg.rowPitch + cfg.rowAscent + BASELINE_FUDGE);
}

/** A fresh deep copy of the default attack-cantrip config (no shared nested refs). */
export function defaultAttackCantripConfig(): AttackCantripConfig {
  return {
    ...ATTACK_CANTRIP_TABLE,
    cols: {
      name: { ...ATTACK_CANTRIP_TABLE.cols.name },
      detail: { ...ATTACK_CANTRIP_TABLE.cols.detail },
    },
  };
}

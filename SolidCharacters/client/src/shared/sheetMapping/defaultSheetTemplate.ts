import { MAPPING_SCHEMA_VERSION, PlacedField, SheetTemplate, TextAlign } from './sheetMapping.types';
import { defaultAttackCantripConfig, defaultSpellTableConfig } from './pdf/spellTable';

/**
 * FULL default placements for the shipped 2-page sheet (`templateId: 'default'`,
 * the 2024 "honze" PHB layout). Coordinates were calibrated by reading every
 * printed label's bounding box with `pdftotext -bbox` (exact PDF points) and
 * cross-checking rendered PNGs — each number is traceable to a real label, not
 * eyeballed pixels.
 *
 * Convention (see `sheetConstants.ts`): `(x, y)` is the baseline-left anchor in
 * PDF points, BOTTOM-LEFT origin; the generator draws it verbatim (no extra
 * Y-flip). Coordinates are written `top(yFromTop)` so each number is the
 * baseline's distance from the PAGE TOP (matches the bbox data / the plan's
 * `y = 792 − pointsFromTop`). `center` fields give the box CENTRE x; the
 * generator subtracts half the measured text width.
 *
 * Coverage: every `SHEET_FIELD_DEFS` / `characterToSheetValues` key is placed
 * EXCEPT — `classAndLevel` (redundant; `className`+`level` placed separately),
 * `subrace`/`age` (no field on this sheet), and `spellsKnown`/`spellsPrepared`
 * (the spell table is drawn directly by `generateSheetPdf`, not as flat fields).
 * Keys blank in the model today (`armorClass`, `speed`, `xp`,
 * `inspiration`) are still placed so they fill once a value exists; the generator
 * skips empty strings.
 */

const PAGE_H = 792;
const top = (yFromTop: number): number => PAGE_H - yFromTop;
const center: TextAlign = 'center';

type FieldExtra = Partial<
  Pick<
    PlacedField,
    | 'fontSize'
    | 'font'
    | 'align'
    | 'maxWidth'
    | 'renderMode'
    | 'boxHeight'
    | 'columns'
    | 'columnGap'
    | 'descMaxChars'
    | 'showDescriptions'
    | 'staticText'
  >
>;

/** Field factory. `yFromTop` is the baseline distance from the page top (see header). */
const f = (fieldKey: string, pageIndex: number, x: number, yFromTop: number, extra: FieldExtra = {}): PlacedField => ({
  fieldKey,
  pageIndex,
  x,
  y: top(yFromTop),
  fontSize: extra.fontSize ?? 10,
  font: extra.font ?? 'Helvetica',
  align: extra.align ?? 'left',
  // Spread optional props only when set so seeded records stay minimal.
  ...(extra.maxWidth ? { maxWidth: extra.maxWidth } : {}),
  ...(extra.renderMode ? { renderMode: extra.renderMode } : {}),
  ...(extra.boxHeight != null ? { boxHeight: extra.boxHeight } : {}),
  ...(extra.columns != null ? { columns: extra.columns } : {}),
  ...(extra.columnGap != null ? { columnGap: extra.columnGap } : {}),
  ...(extra.descMaxChars != null ? { descMaxChars: extra.descMaxChars } : {}),
  ...(extra.showDescriptions != null ? { showDescriptions: extra.showDescriptions } : {}),
  ...(extra.staticText != null ? { staticText: extra.staticText } : {}),
});

// Column anchors shared by ability boxes, saves and skills. L = STR/DEX/CON
// (and their skills); M = INT/WIS/CHA. `mod`/`score` = modifier circle / score
// box; `dot` = proficiency bubble; `val` = the underline blank for a save/skill mod.
const COL: Record<'L' | 'M', { mod: number; score: number; dot: number; val: number }> = {
  L: { mod: 42, score: 75, dot: 13, val: 28 },
  M: { mod: 139, score: 175, dot: 117, val: 133 },
};

/** Ability boxes: `headTop` is the header label's bottom (from `pdftotext -bbox`). */
const ABILITY_ROWS: { key: string; col: 'L' | 'M'; headTop: number }[] = [
  { key: 'str', col: 'L', headTop: 204.5 },
  { key: 'dex', col: 'L', headTop: 315.4 },
  { key: 'con', col: 'L', headTop: 454.6 },
  { key: 'int', col: 'M', headTop: 130.7 },
  { key: 'wis', col: 'M', headTop: 298.1 },
  { key: 'cha', col: 'M', headTop: 465.5 },
];

/** Saving-throw rows: `labelTop` is the "Saving Throw" text baseline (bbox yMax). */
const SAVE_ROWS: { key: string; col: 'L' | 'M'; labelTop: number }[] = [
  { key: 'str', col: 'L', labelTop: 270.8 },
  { key: 'dex', col: 'L', labelTop: 381.8 },
  { key: 'con', col: 'L', labelTop: 520.9 },
  { key: 'int', col: 'M', labelTop: 197.0 },
  { key: 'wis', col: 'M', labelTop: 364.4 },
  { key: 'cha', col: 'M', labelTop: 531.8 },
];

/** Skill rows: `labelTop` is each skill name's text baseline (bbox yMax). */
const SKILL_ROWS: { key: string; col: 'L' | 'M'; labelTop: number }[] = [
  { key: 'athletics', col: 'L', labelTop: 287.1 },
  { key: 'acrobatics', col: 'L', labelTop: 398.0 },
  { key: 'sleightOfHand', col: 'L', labelTop: 412.1 },
  { key: 'stealth', col: 'L', labelTop: 426.3 },
  { key: 'arcana', col: 'M', labelTop: 213.3 },
  { key: 'history', col: 'M', labelTop: 227.4 },
  { key: 'investigation', col: 'M', labelTop: 241.5 },
  { key: 'nature', col: 'M', labelTop: 255.6 },
  { key: 'religion', col: 'M', labelTop: 269.7 },
  { key: 'animalHandling', col: 'M', labelTop: 380.7 },
  { key: 'insight', col: 'M', labelTop: 394.8 },
  { key: 'medicine', col: 'M', labelTop: 408.9 },
  { key: 'perception', col: 'M', labelTop: 423.0 },
  { key: 'survival', col: 'M', labelTop: 437.1 },
  { key: 'deception', col: 'M', labelTop: 548.1 },
  { key: 'intimidation', col: 'M', labelTop: 562.2 },
  { key: 'performance', col: 'M', labelTop: 576.3 },
  { key: 'persuasion', col: 'M', labelTop: 590.4 },
];

// SPELL SLOTS box (page 2): cols Lv 1-3 / 4-6 / 7-9, value on each "Total" blank.
const SLOT_COL_X = [172, 259, 347];
const SLOT_ROW_TOP = [101, 113, 125];

function abilityFields(): PlacedField[] {
  return ABILITY_ROWS.flatMap(({ key, col, headTop }) => {
    const y = headTop + 26; // baseline through the modifier circle / score box
    const c = COL[col];
    return [
      f(`${key}Mod`, 0, c.mod, y, { fontSize: 18, align: center }),
      f(key, 0, c.score, y, { fontSize: 11, align: center }),
    ];
  });
}

function profLineFields(rows: typeof SAVE_ROWS, suffix: 'Save' | ''): PlacedField[] {
  return rows.flatMap(({ key, col, labelTop }) => {
    const c = COL[col];
    return [
      f(`${key}${suffix}`, 0, c.val, labelTop, { fontSize: 9, align: center }),
      // Proficiency dot drawn larger so the '•'/'••' fills the printed bubble.
      f(`${key}${suffix}Prof`, 0, c.dot, labelTop, { fontSize: 12, align: center }),
    ];
  });
}

function spellSlotFields(): PlacedField[] {
  return Array.from({ length: 9 }, (_, i) => {
    const x = SLOT_COL_X[Math.floor(i / 3)];
    const y = SLOT_ROW_TOP[i % 3];
    return f(`spellSlotsLevel${i + 1}`, 1, x, y, { fontSize: 9, align: center });
  });
}

const PAGE_1_FIELDS: PlacedField[] = [
  // ── Identity / header band ──
  // Each field is "write ABOVE the underline, printed caption BELOW it": the value
  // goes in the open space above its rule (which is above the caption). Underlines
  // are at y≈34.8 / 54.7 / 74.7; values sit just above each, captions below.
  f('name', 0, 20, 33, { fontSize: 14 }),
  f('background', 0, 20, 53, { fontSize: 11 }),
  f('className', 0, 135, 53, { fontSize: 11 }),
  f('species', 0, 20, 73, { fontSize: 11 }),
  f('subclass', 0, 135, 73, { fontSize: 11 }),
  // Level oval + XP (value-on-line, above each caption).
  f('level', 0, 277, 37, { fontSize: 13, align: center }),
  f('xp', 0, 277, 62, { fontSize: 9, align: center }),
  // Armour-class shield (blank until AC is sourced from the live form).
  f('armorClass', 0, 335, 50, { fontSize: 18, align: center }),
  f('inspiration', 0, 58, 575, { fontSize: 11, align: center }),

  // ── Stat row + proficiency bonus (caption-on-top: value centred below) ──
  f('proficiencyBonus', 0, 58, 150, { fontSize: 14, align: center }),
  f('initiative', 0, 256, 148, { fontSize: 13, align: center }),
  f('speed', 0, 355, 148, { fontSize: 13, align: center }),
  f('size', 0, 454, 148, { fontSize: 11, align: center }),
  f('passivePerception', 0, 553, 148, { fontSize: 13, align: center }),

  // ── Hit points / hit dice (value-on-line) ──
  f('hpCurrent', 0, 383, 73, { fontSize: 14, align: center }),
  f('hpMax', 0, 426, 73, { fontSize: 11, align: center }),
  f('hpTemp', 0, 426, 48, { fontSize: 11, align: center }),
  f('hitDice', 0, 485, 73, { fontSize: 10, align: center }),

  // ── Feature boxes (bold name + ellipsis-truncated description, in columns) ──
  // For `featureList`, `(x, yFromTop)` is the BOX TOP-LEFT (the list flows down to
  // `top - boxHeight`). Calibrated to the printed rules read off the rendered sheet:
  //  • CLASS FEATURES box: x 212→597.6, top rule 335.7, bottom 544.5, CENTER divider
  //    at 404.8 → two equal columns (x 216, w 378, gap 12 ⇒ colW 183, divider 405).
  //  • SPECIES TRAITS box: x 212→400, header bottom 572.4 (single column).
  //  • FEATS box: x 410→597.6, header bottom 572.4 (single column).
  f('classFeatures', 0, 216, 340, {
    fontSize: 8,
    maxWidth: 378,
    renderMode: 'featureList',
    columns: 2,
    columnGap: 12,
    boxHeight: 202,
    descMaxChars: 70,
  }), // CLASS FEATURES box (two equal columns, divider at x≈405: 340 → 542)
  f('speciesTraits', 0, 216, 576, {
    fontSize: 7,
    maxWidth: 180,
    renderMode: 'featureList',
    columns: 1,
    boxHeight: 120,
    descMaxChars: 50,
  }), // SPECIES TRAITS box (bottom-left, single column: 576 → 696)
  f('feats', 0, 414, 576, {
    fontSize: 7,
    maxWidth: 180,
    renderMode: 'featureList',
    columns: 1,
    boxHeight: 150,
    descMaxChars: 50,
  }), // FEATS box (bottom-right, single column: 576 → 726)

  // ── EQUIPMENT TRAINING & PROFICIENCIES box (page 1, bottom-left) ──
  // Box bounds ≈ x14→199, top y607, bottom y780. Armor entries draw an X centered
  // (align center) on each printed ◇ checkbox; weapons/tools fill their sections.
  // The ◇ glyphs and box rules are vector art (not in the text layer), so these
  // x/y are best-fit from a 300-DPI render + `pdftotext -bbox` of the labels —
  // nudge in the live mapper to pixel-fit.
  f('armorLight', 0, 83, 638, { fontSize: 8, align: center }), // ◇ before "Light"   (label x89.5)
  f('armorMedium', 0, 83, 647, { fontSize: 8, align: center }), // ◇ before "Medium"  (label x89.5)
  f('armorHeavy', 0, 143, 638, { fontSize: 8, align: center }), // ◇ before "Heavy"   (label x149.9)
  f('armorShields', 0, 143, 647, { fontSize: 8, align: center }), // ◇ before "Shields" (label x149.9)
  f('weaponProficiencies', 0, 22, 680, { fontSize: 8, maxWidth: 168 }), // under WEAPONS label (y666)
  f('toolProficiencies', 0, 22, 741, { fontSize: 8, maxWidth: 168 }), // under TOOLS label (y729)

  // Resistances / Vulnerabilities / Immunities — moved INSIDE the box, stacked
  // along its bottom (box bottom ≈ y779) at fontSize 7. Previously floated at
  // x190 and overlapped the neighbouring box's rules.
  f('static:resistances-label', 0, 18, 751, { fontSize: 7, renderMode: 'static', staticText: 'Resistances:' }),
  f('resistances', 0, 78, 751, { fontSize: 7, maxWidth: 114 }),
  f('static:vulnerabilities-label', 0, 18, 762, { fontSize: 7, renderMode: 'static', staticText: 'Vulnerabilities:' }),
  f('vulnerabilities', 0, 78, 762, { fontSize: 7, maxWidth: 114 }),
  f('static:immunities-label', 0, 18, 773, { fontSize: 7, renderMode: 'static', staticText: 'Immunities:' }),
  f('immunities', 0, 78, 773, { fontSize: 7, maxWidth: 114 }),
];

const PAGE_2_FIELDS: PlacedField[] = [
  // SPELLCASTING ABILITY box (narrow left value column; labels on the right).
  f('spellSaveDC', 1, 31, 89, { fontSize: 13, align: center }),
  f('spellAttack', 1, 31, 117, { fontSize: 13, align: center }),
  // The "CANTRIPS & PREPARED SPELLS" table is rendered directly by
  // generateSheetPdf (one spell per row, sorted, with overflow pages), so
  // `spellsPrepared` is intentionally NOT placed here.
  // Right-hand boxes.
  f('alignment', 1, 415, 311, { fontSize: 9 }), // line at the bottom of BACKSTORY box
  f('languages', 1, 414, 362, { fontSize: 9, maxWidth: 180 }),
  f('inventory', 1, 414, 425, { fontSize: 8, maxWidth: 180 }), // EQUIPMENT box (upper)
  f('equipped', 1, 414, 515, { fontSize: 8, maxWidth: 180 }), // EQUIPMENT box (lower)
  f('attuned', 1, 425, 638, { fontSize: 8, maxWidth: 168 }), // MAGIC ITEM ATTUNEMENT
  // COINS row (value box below each label).
  f('currencyCP', 1, 430, 734, { fontSize: 11, align: center }),
  f('currencySP', 1, 466, 734, { fontSize: 11, align: center }),
  f('currencyEP', 1, 502, 734, { fontSize: 11, align: center }),
  f('currencyGP', 1, 538, 734, { fontSize: 11, align: center }),
  f('currencyPP', 1, 575, 734, { fontSize: 11, align: center }),
];

const FIELDS: PlacedField[] = [
  ...PAGE_1_FIELDS,
  ...abilityFields(),
  ...profLineFields(SAVE_ROWS, 'Save'),
  ...profLineFields(SKILL_ROWS, ''),
  ...PAGE_2_FIELDS,
  ...spellSlotFields(),
];

export const DEFAULT_SHEET_TEMPLATE: SheetTemplate = {
  templateId: 'default',
  name: 'Standard D&D 5e Sheet',
  version: MAPPING_SCHEMA_VERSION,
  fields: FIELDS,
  // Table geometry the "CANTRIPS & PREPARED SPELLS" (page 2) and "WEAPONS &
  // DAMAGE CANTRIPS" (page 1) tables are drawn at; editable on the mapping screen.
  spellTable: defaultSpellTableConfig(),
  attackCantripTable: defaultAttackCantripConfig(),
  updatedAt: 0,
};

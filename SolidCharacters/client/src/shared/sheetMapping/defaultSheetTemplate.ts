import { MAPPING_SCHEMA_VERSION, PlacedField, SheetTemplate, TextAlign } from './sheetMapping.types';

/**
 * Starter default placements for the shipped 2-page sheet (`templateId: 'default'`).
 *
 * NOTE: these coordinates are a hand-seeded STARTER set (header, ability boxes,
 * core combat/vitals, a couple of prose blocks) so the editor and live preview
 * show something out of the box. Phase 7 of the mapper plan replaces this with a
 * pixel-calibrated FULL mapping (all 18 skills, saves, spells, equipment,
 * currency). Every other bindable field stays in the palette to be dragged on.
 *
 * Convention (see `sheetConstants.ts`): `(x, y)` = text baseline-left, PDF
 * points, bottom-left origin. The generator draws these verbatim (no extra flip).
 */

type FieldExtra = Partial<Pick<PlacedField, 'fontSize' | 'font' | 'align' | 'maxWidth'>>;

const f = (fieldKey: string, pageIndex: number, x: number, y: number, extra: FieldExtra = {}): PlacedField => ({
  fieldKey,
  pageIndex,
  x,
  y,
  fontSize: extra.fontSize ?? 10,
  font: extra.font ?? 'Helvetica',
  align: extra.align ?? 'left',
  ...(extra.maxWidth ? { maxWidth: extra.maxWidth } : {}),
});

const center: TextAlign = 'center';

const STARTER_FIELDS: PlacedField[] = [
  // ── Identity / header band ──
  f('name', 0, 40, 730, { fontSize: 15 }),
  f('classAndLevel', 0, 250, 748),
  f('background', 0, 392, 748),
  f('species', 0, 250, 726),
  f('subclass', 0, 250, 713, { fontSize: 8 }),
  f('alignment', 0, 392, 726),
  f('xp', 0, 482, 726),

  // ── Ability scores (far-left column boxes; mod large, score small) ──
  f('strMod', 0, 58, 688, { fontSize: 14, align: center }),
  f('str', 0, 58, 671, { fontSize: 9, align: center }),
  f('dexMod', 0, 58, 636, { fontSize: 14, align: center }),
  f('dex', 0, 58, 619, { fontSize: 9, align: center }),
  f('conMod', 0, 58, 584, { fontSize: 14, align: center }),
  f('con', 0, 58, 567, { fontSize: 9, align: center }),
  f('intMod', 0, 58, 532, { fontSize: 14, align: center }),
  f('int', 0, 58, 515, { fontSize: 9, align: center }),
  f('wisMod', 0, 58, 480, { fontSize: 14, align: center }),
  f('wis', 0, 58, 463, { fontSize: 9, align: center }),
  f('chaMod', 0, 58, 428, { fontSize: 14, align: center }),
  f('cha', 0, 58, 411, { fontSize: 9, align: center }),

  // ── Core combat / vitals ──
  f('proficiencyBonus', 0, 128, 700, { align: center }),
  f('passivePerception', 0, 60, 300, { align: center }),
  f('armorClass', 0, 268, 690, { fontSize: 13, align: center }),
  f('initiative', 0, 320, 690, { fontSize: 13, align: center }),
  f('speed', 0, 372, 690, { fontSize: 13, align: center }),
  f('hpMax', 0, 300, 648, { align: center }),
  f('hpCurrent', 0, 300, 628, { fontSize: 13, align: center }),
  f('hpTemp', 0, 300, 588, { align: center }),
  f('hitDice', 0, 300, 532, { align: center }),

  // ── Prose blocks (wrap via maxWidth) ──
  f('features', 0, 415, 560, { fontSize: 8, maxWidth: 170 }),
  f('languages', 0, 60, 250, { fontSize: 8, maxWidth: 150 }),
];

export const DEFAULT_SHEET_TEMPLATE: SheetTemplate = {
  templateId: 'default',
  name: 'Standard D&D 5e Sheet',
  version: MAPPING_SCHEMA_VERSION,
  fields: STARTER_FIELDS,
  updatedAt: 0,
};

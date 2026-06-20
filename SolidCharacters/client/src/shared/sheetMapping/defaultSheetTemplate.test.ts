import { describe, it, expect } from 'vitest';
import { DEFAULT_SHEET_TEMPLATE } from './defaultSheetTemplate';
import { ABILITIES, SHEET_FIELD_DEFS, SKILLS } from './characterFields';

/**
 * Parity contract between the field catalog (`SHEET_FIELD_DEFS` / `SKILLS` /
 * `ABILITIES`) and the shipped default placements. This is the safety net for the
 * "single source of truth is quietly violated" risk: the placement enumerations in
 * `defaultSheetTemplate.ts` (SKILL_ROWS/SAVE_ROWS/ABILITY_ROWS) carry their own
 * stringly-typed keys, so a rename/typo or an added field would otherwise silently
 * fail to draw. We assert against the GENERATED `fields` (not the unexported row
 * arrays) so the `f()` factory + flatMap wiring is covered too.
 */

// Keys intentionally NOT placed on the shipped default sheet (mirrors the header
// comment in defaultSheetTemplate.ts).
const EXEMPT = new Set([
  'classAndLevel', // redundant: className + level placed separately
  'subrace', // no field on this sheet
  'age', // no field on this sheet
  'spellsKnown', // spell table is drawn directly by generateSheetPdf
  'spellsPrepared', // spell table is drawn directly by generateSheetPdf
  'features', // legacy merged list, superseded by classFeatures/speciesTraits/feats
  'otherProficiencies', // superseded by per-category armor*/weapon/tool placements
]);

const fields = DEFAULT_SHEET_TEMPLATE.fields;
const defKeys = new Set(SHEET_FIELD_DEFS.map((d) => d.key));
// Data-bound placements only (static:* fields draw their own literal text).
const placedKeys = new Set(fields.filter((f) => f.renderMode !== 'static').map((f) => f.fieldKey));

describe('defaultSheetTemplate — placement parity', () => {
  it('every data-bound placement maps to a real SHEET_FIELD_DEFS key', () => {
    const unknown = [...placedKeys].filter((k) => !defKeys.has(k));
    expect(unknown, `placements with no matching field def: ${unknown.join(', ')}`).toEqual([]);
  });

  it('every non-exempt field def has a placement', () => {
    const missing = SHEET_FIELD_DEFS.map((d) => d.key).filter((k) => !EXEMPT.has(k) && !placedKeys.has(k));
    expect(missing, `field defs with no placement: ${missing.join(', ')}`).toEqual([]);
  });

  it('places every skill modifier + proficiency marker', () => {
    expect(SKILLS).toHaveLength(18);
    for (const s of SKILLS) {
      expect(placedKeys.has(s.key), `missing skill placement: ${s.key}`).toBe(true);
      expect(placedKeys.has(`${s.key}Prof`), `missing skill prof placement: ${s.key}Prof`).toBe(true);
    }
  });

  it('places every ability score/modifier and saving throw', () => {
    expect(ABILITIES).toHaveLength(6);
    for (const a of ABILITIES) {
      expect(placedKeys.has(a.key), `missing ability score placement: ${a.key}`).toBe(true);
      expect(placedKeys.has(`${a.key}Mod`), `missing ability mod placement: ${a.key}Mod`).toBe(true);
      expect(placedKeys.has(`${a.key}Save`), `missing save placement: ${a.key}Save`).toBe(true);
      expect(placedKeys.has(`${a.key}SaveProf`), `missing save prof placement: ${a.key}SaveProf`).toBe(true);
    }
  });
});

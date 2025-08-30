import { CasterType, SpellCalc, Spellcasting as NewSpellcasting } from '../../../../../models/data/spellcasting';
import { SpellsKnown as OldSpellsKnown } from './SpellsKnown';

// Map UI casterType string to enum
function mapCasterType(caster: string | undefined): CasterType {
  switch ((caster || '').toLowerCase()) {
    case 'half': return CasterType.Half;
    case 'third': return CasterType.Third;
    case 'full': return CasterType.Full;
    case 'pact': return CasterType.Pact;
    default: return CasterType.None;
  }
}

// Convert snake_case slot keys from legacy dictionary to camelCase new model keys
const slotKeyMap: Record<string, string> = {
  cantrips_known: 'cantripsKnown',
  spell_slots_level_1: 'spellSlotsLevel1',
  spell_slots_level_2: 'spellSlotsLevel_2',
  spell_slots_level_3: 'spellSlotsLevel_3',
  spell_slots_level_4: 'spellSlotsLevel_4',
  spell_slots_level_5: 'spellSlotsLevel_5',
  spell_slots_level_6: 'spellSlotsLevel_6',
  spell_slots_level_7: 'spellSlotsLevel_7',
  spell_slots_level_8: 'spellSlotsLevel_8',
  spell_slots_level_9: 'spellSlotsLevel_9',
  spells_known: 'spells_known' // keep passthrough for detection (UI custom known counts)
};

export interface UISpellcastingState {
  info: { name: string; desc: string[] }[];
  castingLevels: { level: number; spellcasting: Record<string, number> }[];
  name: string;
  spellcastingAbility: string; // e.g. "Intelligence"
  casterType: string;
  spellsKnownCalc: OldSpellsKnown;
  spellsKnownRoundup?: boolean;
  ritualCasting?: boolean;
  customKnown?: { level: number; amount: number }[];
}

// Build new model spellcasting from UI legacy-esque state
export function buildDataSpellcasting(ui: UISpellcastingState | undefined, customKnown: { level: number; amount: number }[]): NewSpellcasting | undefined {
  if (!ui) return undefined;
  const casterType = mapCasterType(ui.casterType);

  // Build slots per level
  const slots: Record<number, any> = {};
  (ui.castingLevels || []).forEach(l => {
    const rec: any = {};
    Object.entries(l.spellcasting || {}).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      const mapped = slotKeyMap[k] || k;
      if (mapped.startsWith('spellSlotsLevel') || mapped === 'cantripsKnown') rec[mapped] = v;
    });
    if (Object.keys(rec).length) slots[l.level] = rec;
  });

  // Determine spells known structure
  let known_type: 'number' | 'calc';
  let spells_known: Record<number, number> | SpellCalc;
  if (ui.spellsKnownCalc === OldSpellsKnown.Other) {
    known_type = 'number';
    const record: Record<number, number> = {};
    customKnown.forEach(k => { record[k.level] = k.amount; });
    spells_known = record;
  } else if (ui.spellsKnownCalc === OldSpellsKnown.None) {
    known_type = 'number';
    spells_known = {}; // no auto calc, empty record
  } else {
    known_type = 'calc';
    // Map legacy enumerations to SpellCalc level granularity. Treat HalfLevel / StatModPlusHalfLevel / Third as 'half' in absence of more granular support.
    const levelMapCase = (value: OldSpellsKnown): 'full' | 'half' => {
      switch (value) {
        case OldSpellsKnown.Level:
        case OldSpellsKnown.StatModPlusLevel:
          return 'full';
        default:
          return 'half';
      }
    };
    spells_known = {
      stat: (ui.spellcastingAbility || '').toLowerCase(),
      level: levelMapCase(ui.spellsKnownCalc),
      roundUp: ui.spellsKnownRoundup || false,
    } as SpellCalc;
  }

  const spellcasting: NewSpellcasting = {
    metadata: { slots, casterType },
    known_type,
    spells_known,
    learned_spells: {}, // future: map chosen subclassSpells into per-level groups
  };
  return spellcasting;
}

// Reverse adapter (new model -> UI state signals setters). Limited to fields used.
export function parseDataSpellcasting(data: NewSpellcasting | undefined) {
  if (!data) return undefined;
  // Determine a UI casterType string from enum
  const casterTypeString = (() => {
    switch (data.metadata.casterType) {
      case CasterType.Half: return 'half';
      case CasterType.Third: return 'third';
      case CasterType.Full: return 'full';
      case CasterType.Pact: return 'pact';
      default: return '';
    }
  })();
  // Build castingLevels array from slots record
  const castingLevels = Object.entries(data.metadata.slots || {}).map(([lvl, rec]) => ({
    level: +lvl,
    spellcasting: Object.entries(rec as any).reduce<Record<string, number>>((acc, [k, v]) => {
      // Reverse map for display (leave camelCase; component currently expects snake but we can adjust there)
      acc[k] = v as number; return acc;
    }, {})
  })).sort((a,b)=>a.level-b.level);

  // Derive UI spellsKnownCalc classification (approximation)
  let spellsKnownCalc: OldSpellsKnown = OldSpellsKnown.None;
  let customKnown: { level:number; amount:number }[] = [];
  if (data.known_type === 'calc') {
    // Distinguish full vs half -> reuse Level vs HalfLevel
    const calc = data.spells_known as SpellCalc;
    spellsKnownCalc = calc.level === 'full' ? OldSpellsKnown.Level : OldSpellsKnown.HalfLevel;
  } else {
    const nums = data.spells_known as Record<number, number>;
    if (Object.keys(nums).length) {
      spellsKnownCalc = OldSpellsKnown.Other;
      customKnown = Object.entries(nums).map(([l,v])=>({level:+l, amount:v as number}));
    } else {
      spellsKnownCalc = OldSpellsKnown.None;
    }
  }
  return { casterTypeString, castingLevels, spellsKnownCalc, customKnown };
}

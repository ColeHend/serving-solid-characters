import { getSpellcastingDictionary } from '../../../../../../shared';
import { Spell } from '../../../../../../models/data';
import { Spellcasting } from '../../../../../../models/data/spellcasting';
import { SpellsKnown } from '../SpellsKnown';
import { buildDataSpellcasting, type UISpellcastingState } from '../subclassAdapter';

// Pure spellcasting derivations shared by the Spellcasting step, the Review summary and
// the publish assembly. Operates on a plain snapshot of the casting fields so it stays
// independent of the FormGroup (wizard.shared builds SubclassForm on top of this shape).

export interface SpellcastingFormState {
  hasCasting: boolean;
  /** '' until chosen; subclasses only half- or third-cast. */
  casterType: string;
  /** Full ability word ('Intelligence' | 'Wisdom' | 'Charisma'); '' until chosen. */
  castingModifier: string;
  spellsKnownCalc: SpellsKnown;
  halfCasterRoundUp: boolean;
  hasCantrips: boolean;
  hasRitualCasting: boolean;
  spellsKnownPerLevel: { level: number; amount: number }[];
  spellcastingInfo: { name: string; desc: string[] }[];
  subclassSpells: Spell[];
}

export interface CastingLevelRow {
  level: number;
  spellcasting: Record<string, number>;
}

export function baseCastingLevels(state: SpellcastingFormState): CastingLevelRow[] {
  if (!state.hasCasting) return [];
  return Array.from({ length: 20 }, (_, i) => ({
    level: i + 1,
    spellcasting: getSpellcastingDictionary(i + 1, state.casterType || '', !!state.hasCantrips),
  }));
}

/** Slot table rows with the custom per-level known counts folded in when SpellsKnown.Other. */
export function mergedCastingLevels(state: SpellcastingFormState): CastingLevelRow[] {
  const base = baseCastingLevels(state);
  if (state.spellsKnownCalc !== SpellsKnown.Other) return base;
  const custom = state.spellsKnownPerLevel || [];
  return base.map(row => {
    const match = custom.find(x => x.level === row.level);
    return match ? { ...row, spellcasting: { ...row.spellcasting, spells_known: match.amount } } : row;
  });
}

/** Persisted-model spellcasting for the subclass, or undefined for non-casters. */
export function buildSubclassSpellcasting(name: string, state: SpellcastingFormState): Spellcasting | undefined {
  if (!state.hasCasting) return undefined;
  const ui: UISpellcastingState = {
    info: state.spellcastingInfo || [],
    castingLevels: mergedCastingLevels(state),
    name,
    spellcastingAbility: state.castingModifier || '',
    casterType: state.casterType || '',
    spellsKnownCalc: state.spellsKnownCalc,
    spellsKnownRoundup: !!state.halfCasterRoundUp,
    ritualCasting: !!state.hasRitualCasting,
  };
  return buildDataSpellcasting(ui, state.spellsKnownPerLevel || []);
}

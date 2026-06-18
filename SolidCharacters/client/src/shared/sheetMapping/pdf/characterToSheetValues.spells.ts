import { Character } from '../../../models/character.model';
import { Stats } from '../../customHooks/dndInfo/useCharacters';
import { getAbilityModifier } from '../../customHooks/utility/tools/dndMath';
import getSpellAndCasterLevel from '../../customHooks/utility/tools/getSpellAndCasterLevel';
import { useDnDClasses } from '../../customHooks/dndInfo/info/all/classes';
import { AbilityKey } from '../characterFields';

const signed = (n: number): string => (n >= 0 ? `+${n}` : `${n}`);

/** Spellcasting ability per class (single-class casters). */
const SPELL_ABILITY: Record<string, AbilityKey> = {
  wizard: 'int',
  artificer: 'int',
  cleric: 'wis',
  druid: 'wis',
  ranger: 'wis',
  bard: 'cha',
  sorcerer: 'cha',
  warlock: 'cha',
  paladin: 'cha',
};

/**
 * Derive spell save DC / attack, per-level slots, and known/prepared lists.
 * Spell slots are single-class only (multiclass left blank, per plan). All
 * derived fields default to '' so the key set stays complete.
 */
export function spellValues(char: Character, fullStats: Stats, pb: number): Record<string, string> {
  const out: Record<string, string> = { spellSaveDC: '', spellAttack: '' };
  for (let i = 1; i <= 9; i++) out[`spellSlotsLevel${i}`] = '';

  const spells = char?.spells ?? [];
  out.spellsKnown = spells.map((s) => s.name).filter(Boolean).join(', ');
  out.spellsPrepared = spells.filter((s) => s.prepared).map((s) => s.name).filter(Boolean).join(', ');

  const className = (char?.className ?? '').toLowerCase();
  const ability = SPELL_ABILITY[className];
  if (ability) {
    const mod = getAbilityModifier(fullStats[ability] ?? 10);
    out.spellSaveDC = String(8 + pb + mod);
    out.spellAttack = signed(pb + mod);
  }

  // Spell slots — single-class casters only.
  try {
    const distinctClasses = new Set((char?.levels ?? []).map((l) => l.class).filter(Boolean));
    if (distinctClasses.size <= 1) {
      const class5e = useDnDClasses()().find((c) => c.name?.toLowerCase() === className);
      if (class5e?.spellcasting) {
        const casterLevel = getSpellAndCasterLevel(class5e, 'caster', char.level);
        const slots = class5e.spellcasting.metadata?.slots?.[casterLevel] as Record<string, number | undefined> | undefined;
        if (slots) {
          for (let i = 1; i <= 9; i++) {
            const n = slots[`spellSlotsLevel${i}`];
            if (n) out[`spellSlotsLevel${i}`] = String(n);
          }
        }
      }
    }
  } catch {
    // Leave slots blank if class data is unavailable / not in an owner context.
  }

  return out;
}

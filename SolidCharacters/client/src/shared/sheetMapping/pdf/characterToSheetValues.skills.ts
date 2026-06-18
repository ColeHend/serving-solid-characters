import { Character, CharacterSkillProficiency } from '../../../models/character.model';
import { Stats } from '../../customHooks/dndInfo/useCharacters';
import { getAbilityModifier } from '../../customHooks/utility/tools/dndMath';
import { SKILLS } from '../characterFields';

const signed = (n: number): string => (n >= 0 ? `+${n}` : `${n}`);

/**
 * Derive the 18 skill modifiers + proficiency-dot glyphs. Returns the
 * Perception modifier separately so the caller can compute passive perception.
 *
 * Skill mod = ability mod + (proficient ? pb : 0) + (expertise ? pb : 0).
 * Proficiency lookup is case-insensitive to absorb the `'Sleight Of Hand'`
 * casing inconsistency in `char.proficiencies.skills`.
 */
export function skillValues(
  char: Character,
  fullStats: Stats,
  pb: number,
): { values: Record<string, string>; perceptionMod: number } {
  const skills = char?.proficiencies?.skills ?? {};
  const find = (profKey: string): CharacterSkillProficiency | undefined => {
    if (skills[profKey]) return skills[profKey];
    const match = Object.keys(skills).find((k) => k.toLowerCase() === profKey.toLowerCase());
    return match ? skills[match] : undefined;
  };

  const values: Record<string, string> = {};
  let perceptionMod = 0;

  for (const skill of SKILLS) {
    const entry = find(skill.profKey);
    const proficient = !!entry?.proficient;
    const expertise = !!entry?.expertise;
    const mod = getAbilityModifier(fullStats[skill.stat] ?? 10) + (proficient ? pb : 0) + (expertise ? pb : 0);
    values[skill.key] = signed(mod);
    values[`${skill.key}Prof`] = expertise ? '◉' : proficient ? '●' : '';
    if (skill.key === 'perception') perceptionMod = mod;
  }

  return { values, perceptionMod };
}

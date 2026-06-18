import { Character, DamageAffinity } from '../../../models/character.model';
import { FeatureDetail } from '../../../models/generated';
import { Stats } from '../../customHooks/dndInfo/useCharacters';
import { getAbilityModifier, getProficiencyBonus } from '../../customHooks/utility/tools/dndMath';
import { ABILITIES } from '../characterFields';
import { skillValues } from './characterToSheetValues.skills';
import { spellValues } from './characterToSheetValues.spells';

const signed = (n: number): string => (n >= 0 ? `+${n}` : `${n}`);

/**
 * Pure character → sheet-value mapper. Produces a string for EVERY key in
 * `SHEET_FIELD_DEFS` (empty string when a field is unresolved), so the generator
 * can skip blanks and the key-parity test holds. `fullStats` is the EFFECTIVE
 * ability set (`useExportFullStats` result), computed by the caller in-component.
 */
export function characterToSheetValues(
  char: Character | undefined,
  fullStats: Stats,
  profBonus?: number,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!char) return out; // empty store / no selection → all blank

  const stats = fullStats ?? char.stats;
  const pb = profBonus ?? getProficiencyBonus(char.level || 1);

  // ── Identity ──
  out.name = char.name ?? '';
  out.className = char.className ?? '';
  out.level = String(char.level ?? 0);
  out.classAndLevel = `${char.className ?? ''} ${char.level ?? ''}`.trim();
  out.subclass = (char.subclass ?? []).join(', ');
  out.background = char.background ?? '';
  out.alignment = char.alignment ?? '';
  out.species = char.race?.species ?? '';
  out.subrace = char.race?.subrace ?? '';
  out.size = char.race?.size ?? '';
  out.age = char.race?.age ?? '';
  out.xp = ''; // not stored
  out.inspiration = ''; // not stored

  // ── Abilities ──
  for (const ability of ABILITIES) {
    const score = stats?.[ability.key] ?? 0;
    out[ability.key] = String(score);
    out[`${ability.key}Mod`] = signed(getAbilityModifier(score));
  }
  out.proficiencyBonus = signed(pb);

  // ── Skills (mods + proficiency dots) ──
  const skills = skillValues(char, stats, pb);
  Object.assign(out, skills.values);

  // ── Saving throws (iterate all 6; sparse → non-proficient) ──
  const profSaves = new Set((char.savingThrows ?? []).filter((s) => s.proficient).map((s) => s.stat));
  for (const ability of ABILITIES) {
    const proficient = profSaves.has(ability.key);
    out[`${ability.key}Save`] = signed(getAbilityModifier(stats?.[ability.key] ?? 0) + (proficient ? pb : 0));
    out[`${ability.key}SaveProf`] = proficient ? '●' : '';
  }

  // ── Combat / vitals ──
  out.armorClass = char.ArmorClass ? String(char.ArmorClass) : ''; // stored value is always 0 → blank
  out.initiative = signed(getAbilityModifier(stats?.dex ?? 0));
  out.speed = char.Speed ? String(char.Speed) : char.race?.speed ?? '';
  out.hpMax = String(char.health?.max ?? 0);
  out.hpCurrent = String(char.health?.current ?? 0);
  out.hpTemp = char.health?.temp ? String(char.health.temp) : '';
  out.hitDice = hitDice(char);
  out.passivePerception = String(10 + skills.perceptionMod);

  // ── Spellcasting ──
  Object.assign(out, spellValues(char, stats, pb));

  // ── Features / defenses / proficiencies ──
  out.features = featureNames(char);
  out.languages = languageList(char.languages);
  out.resistances = damageTypes(char.resistances);
  out.vulnerabilities = damageTypes(char.vulnerabilities);
  out.immunities = damageTypes(char.immunities);
  out.otherProficiencies = Object.entries(char.proficiencies?.other ?? {})
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(', ');

  // ── Equipment ──
  out.inventory = (char.items?.inventory ?? []).join(', ');
  out.equipped = (char.items?.equipped ?? []).join(', ');
  out.attuned = (char.items?.attuned ?? []).join(', ');

  // ── Currency (note `sliverPieces` typo key) ──
  const c = char.items?.currency;
  out.currencyPP = String(c?.platinumPieces ?? 0);
  out.currencyGP = String(c?.goldPieces ?? 0);
  out.currencyEP = String(c?.electrumPieces ?? 0);
  out.currencySP = String(c?.sliverPieces ?? 0);
  out.currencyCP = String(c?.copperPieces ?? 0);

  return out;
}

function hitDice(char: Character): string {
  const byDie: Record<number, number> = {};
  for (const lvl of char.levels ?? []) {
    const die = lvl?.hitDie;
    if (!die) continue;
    byDie[die] = (byDie[die] ?? 0) + 1;
  }
  return Object.entries(byDie)
    .map(([die, count]) => `${count}d${die}`)
    .join(', ');
}

function featureNames(char: Character): string {
  const all: FeatureDetail[] = [
    ...(char.features ?? []),
    ...(char.race?.features ?? []),
    ...(char.levels ?? []).flatMap((l) => l.features ?? []),
  ];
  return all.map((f) => f?.name).filter(Boolean).join(', ');
}

function languageList(langs: string[] | undefined): string {
  return ['Common', ...(langs ?? []).filter((l) => l && l.toLowerCase() !== 'common')].join(', ');
}

function damageTypes(arr: DamageAffinity[] | undefined): string {
  return (arr ?? []).filter((d) => d?.value).map((d) => d.type).join(', ');
}

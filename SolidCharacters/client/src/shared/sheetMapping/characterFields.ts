/**
 * Canonical enumeration of every bindable sheet field (the editor palette source
 * and the key-parity contract for `characterToSheetValues`). Mirrors
 * `Plans/character-sheet-field-catalog.md`.
 *
 * `ABILITIES` and `SKILLS` are exported as the SINGLE source of truth shared with
 * the value mapper, so adding a skill/ability updates the palette and the mapper
 * together.
 */

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type SheetFieldGroup =
  | 'Identity'
  | 'Abilities'
  | 'Skills'
  | 'Saves'
  | 'Combat'
  | 'Spellcasting'
  | 'Features'
  | 'Equipment'
  | 'Currency';

export interface SheetFieldDef {
  key: string;
  label: string;
  group: SheetFieldGroup;
}

export interface SkillDef {
  /** Output key for the skill modifier (e.g. `acrobatics`). */
  key: string;
  label: string;
  stat: AbilityKey;
  /** Exact key into `char.proficiencies.skills` (note `'Sleight Of Hand'` casing). */
  profKey: string;
}

export const ABILITIES: { key: AbilityKey; label: string }[] = [
  { key: 'str', label: 'Strength' },
  { key: 'dex', label: 'Dexterity' },
  { key: 'con', label: 'Constitution' },
  { key: 'int', label: 'Intelligence' },
  { key: 'wis', label: 'Wisdom' },
  { key: 'cha', label: 'Charisma' },
];

export const SKILLS: SkillDef[] = [
  { key: 'acrobatics', label: 'Acrobatics', stat: 'dex', profKey: 'Acrobatics' },
  { key: 'animalHandling', label: 'Animal Handling', stat: 'wis', profKey: 'Animal Handling' },
  { key: 'arcana', label: 'Arcana', stat: 'int', profKey: 'Arcana' },
  { key: 'athletics', label: 'Athletics', stat: 'str', profKey: 'Athletics' },
  { key: 'deception', label: 'Deception', stat: 'cha', profKey: 'Deception' },
  { key: 'history', label: 'History', stat: 'int', profKey: 'History' },
  { key: 'insight', label: 'Insight', stat: 'wis', profKey: 'Insight' },
  { key: 'intimidation', label: 'Intimidation', stat: 'cha', profKey: 'Intimidation' },
  { key: 'investigation', label: 'Investigation', stat: 'int', profKey: 'Investigation' },
  { key: 'medicine', label: 'Medicine', stat: 'wis', profKey: 'Medicine' },
  { key: 'nature', label: 'Nature', stat: 'int', profKey: 'Nature' },
  { key: 'perception', label: 'Perception', stat: 'wis', profKey: 'Perception' },
  { key: 'performance', label: 'Performance', stat: 'cha', profKey: 'Performance' },
  { key: 'persuasion', label: 'Persuasion', stat: 'cha', profKey: 'Persuasion' },
  { key: 'religion', label: 'Religion', stat: 'int', profKey: 'Religion' },
  { key: 'sleightOfHand', label: 'Sleight of Hand', stat: 'dex', profKey: 'Sleight Of Hand' },
  { key: 'stealth', label: 'Stealth', stat: 'dex', profKey: 'Stealth' },
  { key: 'survival', label: 'Survival', stat: 'wis', profKey: 'Survival' },
];

const def = (key: string, label: string, group: SheetFieldGroup): SheetFieldDef => ({ key, label, group });

const identity: SheetFieldDef[] = [
  def('name', 'Character Name', 'Identity'),
  def('className', 'Class', 'Identity'),
  def('level', 'Level', 'Identity'),
  def('classAndLevel', 'Class & Level', 'Identity'),
  def('subclass', 'Subclass', 'Identity'),
  def('background', 'Background', 'Identity'),
  def('alignment', 'Alignment', 'Identity'),
  def('species', 'Species', 'Identity'),
  def('subrace', 'Subrace', 'Identity'),
  def('size', 'Size', 'Identity'),
  def('age', 'Age', 'Identity'),
  def('xp', 'Experience Points', 'Identity'),
  def('inspiration', 'Inspiration', 'Identity'),
];

const abilities: SheetFieldDef[] = [
  ...ABILITIES.map((a) => def(a.key, `${a.label} Score`, 'Abilities')),
  ...ABILITIES.map((a) => def(`${a.key}Mod`, `${a.label} Modifier`, 'Abilities')),
  def('proficiencyBonus', 'Proficiency Bonus', 'Abilities'),
];

const skills: SheetFieldDef[] = SKILLS.flatMap((s) => [
  def(s.key, `${s.label} (mod)`, 'Skills'),
  def(`${s.key}Prof`, `${s.label} (proficiency)`, 'Skills'),
]);

const saves: SheetFieldDef[] = ABILITIES.flatMap((a) => [
  def(`${a.key}Save`, `${a.label} Save`, 'Saves'),
  def(`${a.key}SaveProf`, `${a.label} Save (proficiency)`, 'Saves'),
]);

const combat: SheetFieldDef[] = [
  def('armorClass', 'Armor Class', 'Combat'),
  def('initiative', 'Initiative', 'Combat'),
  def('speed', 'Speed', 'Combat'),
  def('hpMax', 'Max HP', 'Combat'),
  def('hpCurrent', 'Current HP', 'Combat'),
  def('hpTemp', 'Temp HP', 'Combat'),
  def('hitDice', 'Hit Dice', 'Combat'),
  def('passivePerception', 'Passive Perception', 'Combat'),
];

const spellcasting: SheetFieldDef[] = [
  def('spellSaveDC', 'Spell Save DC', 'Spellcasting'),
  def('spellAttack', 'Spell Attack Bonus', 'Spellcasting'),
  ...Array.from({ length: 9 }, (_, i) => def(`spellSlotsLevel${i + 1}`, `Spell Slots (Lv ${i + 1})`, 'Spellcasting')),
  def('spellsKnown', 'Spells Known', 'Spellcasting'),
  def('spellsPrepared', 'Spells Prepared', 'Spellcasting'),
];

const features: SheetFieldDef[] = [
  def('features', 'Features & Traits', 'Features'),
  def('languages', 'Languages', 'Features'),
  def('resistances', 'Resistances', 'Features'),
  def('vulnerabilities', 'Vulnerabilities', 'Features'),
  def('immunities', 'Immunities', 'Features'),
  def('otherProficiencies', 'Other Proficiencies', 'Features'),
];

const equipment: SheetFieldDef[] = [
  def('inventory', 'Inventory', 'Equipment'),
  def('equipped', 'Equipped', 'Equipment'),
  def('attuned', 'Attuned', 'Equipment'),
];

const currency: SheetFieldDef[] = [
  def('currencyPP', 'Platinum (pp)', 'Currency'),
  def('currencyGP', 'Gold (gp)', 'Currency'),
  def('currencyEP', 'Electrum (ep)', 'Currency'),
  def('currencySP', 'Silver (sp)', 'Currency'),
  def('currencyCP', 'Copper (cp)', 'Currency'),
];

export const SHEET_FIELD_DEFS: SheetFieldDef[] = [
  ...identity,
  ...abilities,
  ...skills,
  ...saves,
  ...combat,
  ...spellcasting,
  ...features,
  ...equipment,
  ...currency,
];

/** key → human label, for chip/overlay rendering. */
export const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  SHEET_FIELD_DEFS.map((d) => [d.key, d.label]),
);

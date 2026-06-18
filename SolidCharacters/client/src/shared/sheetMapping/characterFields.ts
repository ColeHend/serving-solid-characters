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
  /** Short human description of the field, shown on the Add-palette card. */
  description: string;
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

const def = (key: string, label: string, group: SheetFieldGroup, description: string): SheetFieldDef => ({
  key,
  label,
  group,
  description,
});

const identity: SheetFieldDef[] = [
  def('name', 'Character Name', 'Identity', "The character's name."),
  def('className', 'Class', 'Identity', 'Primary class name.'),
  def('level', 'Level', 'Identity', 'Total character level.'),
  def('classAndLevel', 'Class & Level', 'Identity', "Class and level, e.g. 'Wizard 5'."),
  def('subclass', 'Subclass', 'Identity', 'Chosen subclass or archetype.'),
  def('background', 'Background', 'Identity', "Character's background."),
  def('alignment', 'Alignment', 'Identity', 'Moral and ethical alignment.'),
  def('species', 'Species', 'Identity', 'Character species or race.'),
  def('subrace', 'Subrace', 'Identity', 'Subrace or lineage variant.'),
  def('size', 'Size', 'Identity', 'Size category, e.g. Medium.'),
  def('age', 'Age', 'Identity', "The character's age."),
  def('xp', 'Experience Points', 'Identity', 'Accumulated experience points.'),
  def('inspiration', 'Inspiration', 'Identity', 'Whether the character has inspiration.'),
];

const abilities: SheetFieldDef[] = [
  ...ABILITIES.map((a) => def(a.key, `${a.label} Score`, 'Abilities', `${a.label} ability score.`)),
  ...ABILITIES.map((a) => def(`${a.key}Mod`, `${a.label} Modifier`, 'Abilities', `${a.label} ability modifier.`)),
  def('proficiencyBonus', 'Proficiency Bonus', 'Abilities', 'Bonus added to proficient rolls.'),
];

const skills: SheetFieldDef[] = SKILLS.flatMap((s) => [
  def(s.key, `${s.label} (mod)`, 'Skills', `${s.label} skill modifier.`),
  def(`${s.key}Prof`, `${s.label} (proficiency)`, 'Skills', `Proficiency marker for ${s.label}.`),
]);

const saves: SheetFieldDef[] = ABILITIES.flatMap((a) => [
  def(`${a.key}Save`, `${a.label} Save`, 'Saves', `${a.label} saving-throw modifier.`),
  def(`${a.key}SaveProf`, `${a.label} Save (proficiency)`, 'Saves', `Proficiency marker for the ${a.label} save.`),
]);

const combat: SheetFieldDef[] = [
  def('armorClass', 'Armor Class', 'Combat', 'Armor Class (AC).'),
  def('initiative', 'Initiative', 'Combat', 'Initiative modifier.'),
  def('speed', 'Speed', 'Combat', 'Walking speed in feet.'),
  def('hpMax', 'Max HP', 'Combat', 'Maximum hit points.'),
  def('hpCurrent', 'Current HP', 'Combat', 'Current hit points.'),
  def('hpTemp', 'Temp HP', 'Combat', 'Temporary hit points.'),
  def('hitDice', 'Hit Dice', 'Combat', 'Hit dice pool.'),
  def('passivePerception', 'Passive Perception', 'Combat', '10 + Perception modifier (no roll).'),
];

const spellcasting: SheetFieldDef[] = [
  def('spellSaveDC', 'Spell Save DC', 'Spellcasting', "DC for the character's spells."),
  def('spellAttack', 'Spell Attack Bonus', 'Spellcasting', 'Spell attack roll bonus.'),
  ...Array.from({ length: 9 }, (_, i) =>
    def(`spellSlotsLevel${i + 1}`, `Spell Slots (Lv ${i + 1})`, 'Spellcasting', `Total level-${i + 1} spell slots.`),
  ),
  def('spellsKnown', 'Spells Known', 'Spellcasting', 'Number of spells known.'),
  def('spellsPrepared', 'Spells Prepared', 'Spellcasting', 'Number of spells prepared.'),
];

const features: SheetFieldDef[] = [
  def('features', 'Features & Traits', 'Features', 'Class and feat features & traits.'),
  def('languages', 'Languages', 'Features', 'Languages the character speaks.'),
  def('resistances', 'Resistances', 'Features', 'Damage resistances.'),
  def('vulnerabilities', 'Vulnerabilities', 'Features', 'Damage vulnerabilities.'),
  def('immunities', 'Immunities', 'Features', 'Damage and condition immunities.'),
  def('otherProficiencies', 'Other Proficiencies', 'Features', 'Tool, weapon & armor proficiencies.'),
];

const equipment: SheetFieldDef[] = [
  def('inventory', 'Inventory', 'Equipment', 'Carried items and gear.'),
  def('equipped', 'Equipped', 'Equipment', 'Currently equipped items.'),
  def('attuned', 'Attuned', 'Equipment', 'Items the character is attuned to.'),
];

const currency: SheetFieldDef[] = [
  def('currencyPP', 'Platinum (pp)', 'Currency', 'Platinum pieces carried.'),
  def('currencyGP', 'Gold (gp)', 'Currency', 'Gold pieces carried.'),
  def('currencyEP', 'Electrum (ep)', 'Currency', 'Electrum pieces carried.'),
  def('currencySP', 'Silver (sp)', 'Currency', 'Silver pieces carried.'),
  def('currencyCP', 'Copper (cp)', 'Currency', 'Copper pieces carried.'),
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

/** key → short human description, for the Add-palette field cards. */
export const FIELD_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  SHEET_FIELD_DEFS.map((d) => [d.key, d.description]),
);

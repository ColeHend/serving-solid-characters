export interface AbilityBonusChoice {
  amount: number;
  choices: StatBonus[];
}

export enum AbilityScores {
  STR = 0,
  DEX = 1,
  CON = 2,
  INT = 3,
  WIS = 4,
  CHA = 5,
  CHOICE = 6,
  ALL = 7
}

export interface Background {
  id: string;
  legacy?: boolean;
  source?: string;
  name: string;
  desc: string;
  proficiencies: Proficiencies;
  startEquipment: StartingEquipment[];
  abilityOptions?: string[];
  feat?: string;
  languages?: ChoiceDetail;
  features?: FeatureDetail[];
}

export enum CasterType {
  None = 0,
  Third = 1,
  Half = 2,
  Full = 3,
  Pact = 4
}

export interface ChoiceDetail {
  options: string[];
  amount: number;
}

export interface Choices extends Record<string, ChoiceDetail> {
}

export interface Class5E {
  id: string;
  legacy?: boolean;
  source?: string;
  name: string;
  hitDie: string;
  primaryAbility: string;
  savingThrows: string[];
  startingEquipment: StartingEquipment[];
  proficiencies: Proficiencies;
  spellcasting?: Spellcasting;
  startChoices: ClassStartChoices;
  features?: Record<number, FeatureDetail[]>;
  choices?: Choices;
  classSpecific?: Record<string, Record<number, string>>;
}

export interface ClassStartChoices {
  weapon?: string;
  armor?: string;
  skills?: string;
  tools?: string;
  equipment?: string;
}

export interface CreatureProficiency {
  skills: Record<string, SkillProficiency>;
  other: Record<string, boolean>;
}

export interface CreatureSenses {
  darkvision?: number;
  blindsight?: number;
  tremorsense?: number;
  truesight?: number;
  passivePerception?: number;
}

export interface DamageAffinity {
  type: string;
  value: boolean;
}

export interface DamageEntry {
  dice: string;
  type: string;
  addAbilityModifier: boolean;
  bonus?: number;
}

export interface Feat {
  id: string;
  legacy?: boolean;
  source?: string;
  details: FeatureDetail;
  prerequisites: Prerequisite[];
}

export interface FeatureDetail {
  id: string;
  name: string;
  description: string;
  choiceKey?: string;
  metadata?: FeatureMetadata;
}

export interface FeatureMetadata {
  uses?: number;
  recharge?: string;
  spells?: string[];
  category?: string;
  mads?: MadFeature[];
}

export interface GrantedAction {
  name: string;
  actionType: string;
  description?: string;
  source?: string;
  uses?: number;
  proficiencyBonus?: string;
  recharge?: string;
}

export interface Health {
  max: number;
  current: number;
  temp: number;
}

export interface Item {
  id: string;
  legacy?: boolean;
  source?: string;
  name: string;
  desc: string;
  type: ItemType;
  weight: number;
  cost: string;
  properties: Record<string, unknown>;
}

export enum ItemType {
  Weapon = 0,
  Armor = 1,
  Tool = 2,
  Item = 3
}

export interface MadFeature {
  command: string;
  value: Record<string, string>;
  type: MadType;
  prerequisites: MadPrerequisite[];
  group: number;
}

export interface MadPrerequisite {
  value?: string;
  operation?: string;
  keyValue?: string;
  group: number;
}

export enum MadType {
  Character = 0,
  Info = 1
}

export interface MagicItem {
  id: string;
  legacy?: boolean;
  source?: string;
  name: string;
  desc: string;
  rarity: string;
  cost: string;
  category: string;
  weight: string;
  properties: MagicItemProperties;
  metadata?: FeatureMetadata;
}

export interface MagicItemProperties {
  attunement?: string;
  effect?: string;
  charges?: string;
}

export interface Monster {
  id: string;
  legacy?: boolean;
  source?: string;
  name: string;
  size: string;
  type: string;
  subtype?: string;
  alignment?: string;
  stats: Stats;
  armorClass: number;
  armorDesc?: string;
  health: Health;
  hitDice?: string;
  speed: number;
  movementSpeeds: MovementSpeeds;
  senses: CreatureSenses;
  savingThrows: SavingThrow[];
  proficiencies: CreatureProficiency;
  resistances: DamageAffinity[];
  vulnerabilities: DamageAffinity[];
  immunities: DamageAffinity[];
  conditionImmunities: string[];
  languages: string[];
  features: FeatureDetail[];
  grantedActions: GrantedAction[];
  rollAdvantages: RollAdvantage[];
  rollBonuses: RollBonus[];
  attacks: MonsterAttack[];
  attacksPerAction: number;
  legendaryActions?: MonsterAttack[];
  legendaryActionCount?: number;
  challengeRating: string;
  proficiencyBonus?: number;
  xp?: number;
}

export interface MonsterAttack {
  name: string;
  actionType: string;
  description?: string;
  attackType?: string;
  ability?: string;
  proficient: boolean;
  toHitOverride?: number;
  critThreshold?: number;
  reach?: string;
  range?: string;
  save?: MonsterSave;
  targetCount?: number;
  damage: DamageEntry[];
  count?: number;
  recharge?: string;
  uses?: string;
}

export interface MonsterSave {
  targetAbility: string;
  dcAbility?: string;
  dcOverride?: number;
  type: string;
}

export interface MovementSpeeds {
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
  hover?: boolean;
}

export interface Prerequisite {
  type: PrerequisiteType;
  value: string;
}

export enum PrerequisiteType {
  String = 0,
  Level = 1,
  Class = 2,
  Subclass = 3,
  Feat = 4,
  Race = 5,
  Item = 6,
  Stat = 7
}

export interface Proficiencies {
  armor: string[];
  weapons: string[];
  tools: string[];
  skills: string[];
}

export interface Race {
  id: string;
  legacy?: boolean;
  source?: string;
  name: string;
  size: string;
  speed: number;
  languages: string[];
  languageChoice?: ChoiceDetail;
  abilityBonuses: StatBonus[];
  abilityBonusChoice?: AbilityBonusChoice;
  traits: Feat[];
  traitChoice?: TraitChoice;
  descriptions?: Record<string, string>;
}

export interface RollAdvantage {
  rollType: string;
  mode: string;
  stat?: string;
  condition?: string;
  source?: string;
}

export interface RollBonus {
  rollType: string;
  bonus?: number;
  proficiencyBonus?: string;
  stat?: string;
  condition?: string;
  source?: string;
}

export interface Rule {
  id: string;
  legacy?: boolean;
  source?: string;
  name: string;
  description: string;
  category?: string;
  tags: string[];
  related?: string[];
  page?: string;
}

export interface SavingThrow {
  stat: string;
  proficient: boolean;
}

export interface SkillProficiency {
  stat: string;
  value: number;
  proficient: boolean;
  expertise: boolean;
}

export interface Spell {
  id: string;
  legacy?: boolean;
  source?: string;
  name: string;
  description: string;
  duration: string;
  concentration: boolean;
  components: string;
  level: string;
  range: string;
  ritual: boolean;
  school: string;
  castingTime: string;
  damageType: string;
  page: string;
  isMaterial: boolean;
  isSomatic: boolean;
  isVerbal: boolean;
  materialsNeeded?: string;
  higherLevel?: string;
  classes: string[];
  subClasses: string[];
}

export interface SpellCalc {
  stat: string;
  level: SpellCalcLevel;
  roundUp?: boolean;
}

export enum SpellCalcLevel {
  Full = 0,
  Half = 1
}

export interface Spellcasting {
  metadata: SpellcastingMetadata;
  knownType: SpellKnownType;
  spellsKnown?: Record<number, number>;
  spellsKnownCalc?: SpellCalc;
  learnedSpells: Record<number, string[]>;
}

export interface SpellcastingMetadata {
  slots: Record<number, Spellslots>;
  casterType: CasterType;
}

export enum SpellKnownType {
  Number = 0,
  Calc = 1
}

export interface Spellslots {
  cantripsKnown?: number;
  spellSlotsLevel1?: number;
  spellSlotsLevel2?: number;
  spellSlotsLevel3?: number;
  spellSlotsLevel4?: number;
  spellSlotsLevel5?: number;
  spellSlotsLevel6?: number;
  spellSlotsLevel7?: number;
  spellSlotsLevel8?: number;
  spellSlotsLevel9?: number;
}

export interface StartingEquipment {
  optionKeys?: string[];
  items?: string[];
}

export interface StatBonus {
  stat: AbilityScores;
  value: number;
}

export interface Stats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Subclass {
  id: string;
  legacy?: boolean;
  source?: string;
  name: string;
  parentClass: string;
  parentClassId?: string;
  description: string;
  features: Record<number, FeatureDetail[]>;
  choices?: Choices;
  spellcasting?: Spellcasting;
}

export interface Subrace extends Race {
  parentRace: string;
  id: string;
  legacy?: boolean;
  source?: string;
  name: string;
  size: string;
  speed: number;
  languages: string[];
  languageChoice?: ChoiceDetail;
  abilityBonuses: StatBonus[];
  abilityBonusChoice?: AbilityBonusChoice;
  traits: Feat[];
  traitChoice?: TraitChoice;
  descriptions?: Record<string, string>;
}

export interface TraitChoice {
  amount: number;
  choices: Feat[];
}

export interface WeaponMastery {
  id: string;
  legacy?: boolean;
  source?: string;
  name: string;
  damage: string;
  properties: string[];
  mastery: string;
}

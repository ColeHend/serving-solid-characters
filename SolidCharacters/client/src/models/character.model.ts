import { Stats } from "../shared";
import { FeatureDetail } from "./generated";

export class Character {
  /** Stable identity and Dexie primary key (minted via createNewId on create). '' = not yet saved. */
  public id: string = '';
  public name: string = '';
  public get level() {
    return this.levels.length;
  };
  public levels: CharacterLevel[] = [];
  public spells: CharacterSpell[] = [];
  public race: CharacterRace = {
    species: "",
    features: []
  }
  public ArmorClass: number = 0;
  public Speed: number = 0;
  public movementTypes: MovementType[] = [MovementType.Walk];
  /** Distinct speeds (feet) for non-walking modes; a mode in movementTypes with no entry here moves at the walking Speed. */
  public movementSpeeds: MovementSpeeds = {};
  /** Special senses and their ranges in feet (darkvision 60, ...). */
  public senses: CharacterSenses = {};
  public className: string = '';
  public subclass: string[] = [];
  public background: string = '';
  /** Selector key of the chosen background (SRD id or hb:<name>). Absent on older saves — resolve by name. */
  public backgroundId?: string;
  public alignment: string = '';
  public features: FeatureDetail[] = [];
  /**
   * The background's own features (raw, unapplied) — a mads source like race.features.
   * Kept separate from `features` (feats) so background choices aren't mistagged as feat picks.
   * Absent on pre-existing saves; re-derived from the catalog on every creator save.
   */
  public backgroundFeatures?: FeatureDetail[];
  public proficiencies: CharacterProficiency = {
    skills: {},
    other: {}
  };
  public savingThrows: CharacterSavingThrow[] = [];
  public rollAdvantages: RollAdvantage[] = [];
  public rollBonuses: RollBonus[] = [];
  public grantedActions: GrantedAction[] = [];
  public attacksPerAction: number = 1;
  /** Spent use counts per limited-use feature, keyed by feature name (feature ids are often empty). */
  public featureUses: Record<string, number> = {};
  /** Resolved picks for choice-form AddStats commands, keyed by feature name → ability key ("str".."cha"). */
  public statChoices: Record<string, string> = {};
  /** Resolved picks for choice-form AddProficiencies commands, keyed like statChoices → CSV of skill names. */
  public proficiencyChoices: Record<string, string> = {};
  /** Resolved picks for choice-form AddSpells commands, keyed by spellChoiceKey → CSV of spell ids. */
  public spellChoices: Record<string, string> = {};
  /** Resolved picks for choice-form AddItems commands, keyed by itemChoiceKey → CSV of item ids. */
  public itemChoices: Record<string, string> = {};
  public resistances: DamageAffinity[] = [];
  public vulnerabilities: DamageAffinity[] = [];
  public immunities: DamageAffinity[] = [];
  public languages: string[] = [];
  public health: CharacterHealth = {
    max: 0,
    current: 0,
    temp: 0
  };
  public stats: Stats = {
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0
  }
  public items: CharacterGear = {
    inventory: [],
    equipped: [],
    attuned: [],
    currency: {
      platinumPieces: 0,
      goldPieces: 0,
      electrumPieces: 0,
      sliverPieces: 0,
      copperPieces: 0
    }

  }
  /** Which ruleset the character was built under. Absent on pre-rebuild characters (treat as 2014). */
  public edition?: RulesetSelection;
  /** Appearance, personality, and backstory freetext from the Details & Story section. */
  public details?: CharacterDetails;
  /** Feats picked in the creator, tagged with where they came from. */
  public featsTaken?: CharacterFeatTaken[];
  /** Creator round-trip state so edit mode can restore the exact builder inputs. View/PDF ignore it. */
  public builder?: CharacterBuilderState;
  /** True = stats already include species/background/manual bonuses; consumers must not re-add race bonuses. */
  public statsInclusive?: boolean;
}

export type CharacterEdition = '2014' | '2024';
/** What the creator builds against: one edition, or both merged (legacy rows badged). */
export type RulesetSelection = CharacterEdition | 'both';

export interface CharacterDetails {
  gender?: string;
  pronouns?: string;
  age?: string;
  height?: string;
  weight?: string;
  eyes?: string;
  hair?: string;
  skin?: string;
  faith?: string;
  appearance?: string;
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  backstory?: string;
  /** Downscaled (≤512px) JPEG data-URL. */
  portrait?: string;
}

export interface CharacterFeatTaken {
  name: string;
  source: 'background' | 'chosen';
  /** Selector key of the feat (SRD id or hb:<name>). Absent on older saves — resolve by name. */
  id?: string;
}

export type SkillOverrideState = 'none' | 'proficient' | 'expertise';
export type AbilityGenMethod = 'standard' | 'extended' | 'pointbuy' | 'roll' | 'manual';

export interface CharacterBuilderState {
  abilityMethod: AbilityGenMethod;
  baseScores: Stats;
  bonusScores: Stats;
  /** Legacy saves only: 2024 background boost map — migrated onto abilityBonuses on load. */
  backgroundBoosts?: Partial<Record<keyof Stats, number>>;
  /** Ability each species/background bonus token is assigned to ('' = unassigned). */
  abilityBonuses?: { species: string[]; background: string[] };
  /** +2/+1 (standard) vs three +1s (spread) per bonus source. */
  abilityBonusStyle?: { species: 'standard' | 'spread'; background: 'standard' | 'spread' };
  /** Explicit skill-pill overrides only; unset skills derive from class/background picks. */
  skillOverrides: Record<string, SkillOverrideState>;
  /** Chosen class skills keyed by class name. */
  classSkillChoices: Record<string, string[]>;
  /** 4d6-drop-lowest results when abilityMethod is 'roll'. */
  rolledPool: number[];
  /** Legacy saves only: species abilityBonusChoice picks — migrated onto abilityBonuses on load. */
  raceAbilityChoices?: string[];
  /** Species languageChoice picks. Absent on older saves. */
  raceLanguageChoices?: string[];
  /** Species traitChoice picks (trait names). Absent on older saves. */
  raceTraitChoices?: string[];
  /** Origin-feat override; '' or absent = the background's recommended feat. */
  originFeat?: string;
  /**
   * Feat-or-ASI slot decisions keyed by the ASI feature's id: "asi" or the chosen feat's
   * selector key. The chosen feats are ALSO written into featsTaken (so mads/views apply
   * them); this map only remembers which slot they came from. Absent on older saves.
   */
  featOrAsi?: Record<string, string>;
  /** Hit-point inputs from the creator's Hit Points section. Absent = fully auto-computed. */
  hp?: CharacterHpOverride;
}

/** Manual HP entries; undefined maxOverride/current fall back to the computed values. */
export interface CharacterHpOverride {
  maxOverride?: number;
  current?: number;
  temp: number;
}
export interface CharacterProficiency {
	skills: Record<string, CharacterSkillProficiency>
	other: Record<string, boolean>;
}
export interface CharacterSkillProficiency {
	stat: keyof Stats;
	value: number;
	proficient: boolean;
	expertise: boolean;
}
export interface CharacterRace {
	species: string;
	/** Selector key of the species (SRD id or hb:<name>). Absent on older saves — resolve by name. */
	speciesId?: string;
	subrace?: string;
	/** Selector key of the subrace. Absent on older saves — resolve by name. */
	subraceId?: string;
	age?: string;
	size?: string;
	speed?: string;
	features: FeatureDetail[];
}
export interface CharacterHealth {
	max: number;
	current: number;
	temp: number;
}
export interface CharacterSpell {
	name: string;
	prepared: boolean;
	/** Spell id when resolvable. Absent on older saves — resolve by name. */
	id?: string;
}
export interface CharacterLevel {
	class: string;
	/** Selector key of the class (SRD id or hb:<name>). Absent on older saves — resolve by name. */
	classId?: string;
	subclass?: string;
	/** Selector key of the subclass. Absent on older saves — resolve by name. */
	subclassId?: string;
	level: number;
	hitDie: number;
	features: FeatureDetail[];
}
/** Gear entry: display name plus the item's selector key when it came from the catalog. */
export interface CharacterItemRef {
  name: string;
  /** Selector key of the item (SRD id or hb:<name>). Absent on free-text/pack entries. */
  id?: string;
}

/** Older saves stored plain name strings — every gear reader must go through itemRefName. */
export type CharacterGearEntry = string | CharacterItemRef;

/** Tolerant display-name reader for gear entries of either shape. */
export const itemRefName = (entry: CharacterGearEntry): string =>
  typeof entry === "string" ? entry : entry.name;

/** Selector key of a gear entry when it has one (never derived from the bare name). */
export const itemRefId = (entry: CharacterGearEntry): string | undefined =>
  typeof entry === "string" ? undefined : entry.id;

export interface CharacterGear {
	inventory: CharacterGearEntry[];
	equipped: CharacterGearEntry[];
	attuned: CharacterGearEntry[];
  currency: CharacterCurrency;
}

export interface CharacterCurrency {
  platinumPieces: number;
  goldPieces: number;
  electrumPieces: number;
  sliverPieces: number;
  copperPieces: number;
}

export interface DamageAffinity {
  type: string;
  value: boolean;
}

export interface CharacterSavingThrow {
  stat: keyof Stats;
  proficient: boolean;
}

export type AdvantageMode = "advantage" | "disadvantage";
export type AdvantageRollType = "SavingThrow" | "WeaponAttack" | "SpellAttack" | "Initiative" | "AbilityCheck";

export interface RollAdvantage {
  rollType: AdvantageRollType;
  mode: AdvantageMode;
  /** Only meaningful for SavingThrow / AbilityCheck; absent = all stats. */
  stat?: keyof Stats;
  /** Free-text qualifier, e.g. "against being frightened". */
  condition?: string;
  /** Name of the feature that granted it. */
  source?: string;
}

/** Fractions of the proficiency bonus a RollBonus can grant (matches PB_CHOICES in the command catalog). */
export type PbFraction = "Third PB" | "Half PB" | "Full PB";

/** A flat or proficiency-bonus modifier to a d20 roll (AddRollBonus) — distinct from advantage. */
export interface RollBonus {
  rollType: AdvantageRollType;
  /** Fixed modifier (Archery's +2). Absent when proficiencyBonus drives the value. */
  bonus?: number;
  /** The bonus equals this fraction of the character's proficiency bonus (Alert's PB to Initiative). */
  proficiencyBonus?: PbFraction;
  /**
   * An ability whose MODIFIER is ADDED to the roll ("add your Wisdom modifier to Initiative").
   * Distinct from `stat`, which only narrows which saves/checks the bonus applies to and is never added.
   */
  statBonus?: keyof Stats;
  /** Only meaningful for SavingThrow / AbilityCheck; absent = all stats. */
  stat?: keyof Stats;
  /** Free-text qualifier, e.g. "with Ranged weapons". */
  condition?: string;
  /** Name of the feature that granted it. */
  source?: string;
}

export type ActionType = "action" | "bonusAction" | "reaction";

/** When a limited-use pool refills (matches RECHARGE_TYPES in the command catalog). */
export type RestType = "Short Rest" | "Long Rest";

/** An action/bonus action/reaction a mad granted the character (Channel Divinity, Second Wind, ...). */
export interface GrantedAction {
  name: string;
  actionType: ActionType;
  /** Rules text for the action, when it differs from the granting feature's description. */
  description?: string;
  /** Name of the granting feature — links to featureUses (keyed by feature name) for uses tracking. */
  source?: string;
  /** Inline fixed number of uses. Absent when proficiencyBonus drives it, or the action is unlimited. */
  uses?: number;
  /** Inline uses equal to this fraction of the proficiency bonus (a fixed `uses` wins over this). */
  proficiencyBonus?: PbFraction;
  /** When the inline uses refill; only meaningful alongside uses/proficiencyBonus. */
  recharge?: RestType;
}

// -- Character Form Models --

type halfCharacter = Omit<Character,"levels"|"race"|"proficiencies"|"health"|"stats"|"items"|"level"|"spells"|"features"|"savingThrows"|"vulnerabilities"|"immunities"|"resistances"|"rollAdvantages"|"rollBonuses"|"grantedActions"|"attacksPerAction"|"featureUses">

export interface CharacterForm extends halfCharacter {
  race: string;
  maxHP: number;
  currentHP: number;
  tempHP: number;
  PP: number;
  GP: number;
  EP: number;
  SP: number;
  CP: number;
  lineage: string;
  clsGold: number;
  backgrndGold: number;
  backgrndItemChoice: string|null;
  classItemChoice: string|null;
  BackgrndFeat: string;
}

export enum MovementType {
  Walk,
  Fly,
  Swim,
  Climb,
  Burrow
}

/** movementSpeeds keys — walking speed lives on Character.Speed, so Walk has no entry. */
export type MovementSpeedKey = "fly" | "swim" | "climb" | "burrow";
export type MovementSpeeds = Partial<Record<MovementSpeedKey, number>>;

export type SenseKey = "darkvision" | "blindsight" | "tremorsense" | "truesight";
export type CharacterSenses = Partial<Record<SenseKey, number>>;
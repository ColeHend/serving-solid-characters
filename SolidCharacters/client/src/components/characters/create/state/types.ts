import {
  AbilityGenMethod,
  CharacterDetails,
  RulesetSelection,
  SkillOverrideState,
} from "../../../../models/character.model";
import { Stats } from "../../../../shared/customHooks/dndInfo/useCharacters";
import { AbilityKey } from "../rules/constants";

export interface DraftClass {
  name: string;
  /** Selector key of the class (SRD id or hb:<name>). Absent on legacy saves — matched by name. */
  classId?: string;
  level: number;
  /** '' until the subclass is chosen. */
  subclass: string;
  /** Selector key of the chosen subclass. Absent on legacy saves — matched by name. */
  subclassId?: string;
  /** Picked class skills for this class. */
  skillChoices: string[];
}

/** Manual HP entries; undefined maxOverride/current fall back to the computed values. */
export interface DraftHp {
  maxOverride?: number;
  current?: number;
  temp: number;
}

export interface DraftItems {
  inventory: string[];
  equipped: string[];
  attuned: string[];
  currency: { pp: number; gp: number; ep: number; sp: number; cp: number };
  /**
   * Picked class equipment option per choice group (2014 classes have several groups,
   * "start_1"/"start_2"; 2024 classes a single "equipment" group). Empty when taking gold.
   */
  classItemChoices: Record<string, string>;
  backgroundItemChoice: string | null;
  classGold: number;
  backgroundGold: number;
}

export interface CharacterDraft {
  edition: RulesetSelection;
  /** Saved character's id when editing — identity across saves. Absent = brand new. */
  characterId?: string;
  name: string;
  alignment: string;
  /** [0] is the initial class — saving throws and the INITIAL chip come from it. */
  classes: DraftClass[];
  species: string;
  /** Selector key of the species. Absent on legacy saves — matched by name. */
  speciesId?: string;
  /** Subrace/lineage name; shown whenever the species has subraces (any edition). */
  lineage: string;
  /** Selector key of the chosen subrace. Absent on legacy saves — matched by name. */
  lineageId?: string;
  background: string;
  /** Selector key of the background. Absent on legacy saves — matched by name. */
  backgroundId?: string;
  /** Origin-feat override; '' takes the background's recommended feat. */
  originFeat: string;
  /** Selector key of the origin-feat override. Absent on legacy saves — matched by name. */
  originFeatId?: string;
  /** Manual HP entries; unset fields fall back to the auto-computed values. */
  hp: DraftHp;
  /** Languages besides Common (manual/background picks — species grants live separately). */
  languages: string[];
  /** Picked abilities for the species' abilityBonusChoice (2014 Half-Elf's two +1s). */
  raceAbilityChoices: AbilityKey[];
  /** Picked languages for the species' languageChoice. */
  raceLanguageChoices: string[];
  /** Picked trait names for the species' traitChoice (no SRD race has one — homebrew support). */
  raceTraitChoices: string[];
  abilityMethod: AbilityGenMethod;
  baseScores: Stats;
  bonusScores: Stats;
  /** 2024 background boost per ability (+2/+1 or three +1s). */
  backgroundBoosts: Partial<Record<AbilityKey, number>>;
  /** 4d6-drop-lowest results awaiting assignment when abilityMethod is 'roll'. */
  rolledPool: number[];
  /** Explicit skill-pill overrides; unset skills derive from class/background picks. */
  skillOverrides: Record<string, SkillOverrideState>;
  /** Chosen feat names. The background's origin feat is derived, not stored. */
  feats: string[];
  /**
   * Picks for choice-form MADS commands on features (ASI abilities, skill proficiencies,
   * spell choices), keyed like Character.statChoices/proficiencyChoices/spellChoices.
   */
  madChoices: {
    stats: Record<string, string>;
    /** CSV of picked skill names per choice key. */
    proficiencies: Record<string, string>;
    /** CSV of picked spell ids per choice key. */
    spells: Record<string, string>;
  };
  /** Known spell names. */
  spells: string[];
  details: CharacterDetails;
  items: DraftItems;
}

export const zeroScores = (): Stats => ({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });

/**
 * Default base scores per generation method. Array methods start UNASSIGNED (full pool,
 * drag or pick to place — nothing prefilled); point buy starts at its rule floor of 8s;
 * manual starts at a neutral 10.
 */
export function defaultBaseScores(method: AbilityGenMethod): Stats {
  switch (method) {
    case "standard":
    case "extended":
    case "roll":
      return zeroScores();
    case "pointbuy":
      return { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
    case "manual":
      return { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  }
}

export function emptyDraft(edition: RulesetSelection, overrides?: Partial<CharacterDraft>): CharacterDraft {
  return {
    edition,
    name: "",
    alignment: "true neutral",
    classes: [],
    species: "",
    lineage: "",
    background: "",
    originFeat: "",
    hp: { temp: 0 },
    languages: [],
    raceAbilityChoices: [],
    raceLanguageChoices: [],
    raceTraitChoices: [],
    abilityMethod: "standard",
    baseScores: defaultBaseScores("standard"),
    bonusScores: zeroScores(),
    backgroundBoosts: {},
    rolledPool: [],
    skillOverrides: {},
    feats: [],
    madChoices: { stats: {}, proficiencies: {}, spells: {} },
    spells: [],
    details: {},
    items: {
      inventory: [],
      equipped: [],
      attuned: [],
      currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
      classItemChoices: {},
      backgroundItemChoice: null,
      classGold: 0,
      backgroundGold: 0,
    },
    ...overrides,
  };
}

/**
 * On-disk JSON shapes for SolidCharacters.Repository/data/srd/{2014,2024}.
 * These mirror the C# DTOs in SolidCharacters.Domain/Models/DTO/Class5e.cs using the
 * EXACT key casing found in the served files (snake_case where [JsonProperty] dictates,
 * camelCase otherwise). Newtonsoft reads case-insensitively, but we match the files.
 */

export type Ruleset = "2014" | "2024";

export interface MadFeatureJson {
    command: string;
    value: Record<string, string>;
    type: number; // 0 Character, 1 Info
    prerequisites: unknown[];
    group: number;
}

export interface FeatureMetadataJson {
    uses?: number;
    recharge?: string;
    spells?: string[];
    category?: string;
    mads?: MadFeatureJson[];
}

export interface FeatureDetailJson {
    id: string;
    name: string;
    description: string;
    choiceKey?: string;
    metadata?: FeatureMetadataJson;
}

export interface PrerequisiteJson {
    type: number;
    value: string;
}

export interface FeatJson {
    id: string;
    details: FeatureDetailJson;
    prerequisites: PrerequisiteJson[];
}

export interface ChoiceDetailJson {
    options: string[];
    amount: number;
}

export interface StartingEquipmentJson {
    optionKeys?: string[];
    items?: string[];
}

export interface ProficienciesJson {
    armor: string[];
    weapons: string[];
    tools: string[];
    skills: string[];
}

export interface SpellslotsJson {
    cantrips_known?: number;
    spell_slots_level_1?: number;
    spell_slots_level_2?: number;
    spell_slots_level_3?: number;
    spell_slots_level_4?: number;
    spell_slots_level_5?: number;
    spell_slots_level_6?: number;
    spell_slots_level_7?: number;
    spell_slots_level_8?: number;
    spell_slots_level_9?: number;
}

export interface SpellcastingJson {
    metadata: {
        slots: Record<string, SpellslotsJson>;
        casterType: number; // CasterType enum
    };
    known_type: string; // "number" | "calc"
    spells_known?: Record<string, number>;
    spells_known_calc?: { stat: string; level: string; roundUp?: boolean };
    learnedSpells?: Record<string, string[]>;
}

export interface ClassJson {
    id: string;
    name: string;
    hit_die: string;
    primary_ability: string;
    saving_throws: string[];
    starting_equipment: StartingEquipmentJson[];
    proficiencies: ProficienciesJson;
    spellcasting?: SpellcastingJson;
    start_choices?: Record<string, string>;
    features: Record<string, FeatureDetailJson[]>;
    choices: Record<string, ChoiceDetailJson>;
    classSpecific: Record<string, Record<string, string>>;
}

export interface SubclassJson {
    id: string;
    name: string;
    parent_class: string;
    description: string;
    features: Record<string, FeatureDetailJson[]>;
    choices?: Record<string, ChoiceDetailJson>;
    spellcasting?: SpellcastingJson | null;
}

export interface StatBonusJson {
    stat: number; // AbilityScores enum: STR=0..CHA=5, CHOICE=6, ALL=7
    value: number;
}

export interface AbilityBonusChoiceJson {
    amount: number;
    choices: StatBonusJson[];
}

export interface RaceJson {
    id: string;
    name: string;
    size: string;
    speed: number;
    languages: string[];
    languageChoice?: ChoiceDetailJson;
    abilityBonuses: StatBonusJson[];
    abilityBonusChoice?: AbilityBonusChoiceJson;
    traits: FeatJson[];
    traitChoice?: { amount: number; choices: FeatJson[] };
    descriptions?: Record<string, string>;
}

export interface SubraceJson extends RaceJson {
    parentRace: string; // parent race id
}

export interface BackgroundJson {
    id: string;
    name: string;
    desc: string;
    proficiencies: ProficienciesJson;
    startEquipment: StartingEquipmentJson[];
    abilityOptions?: string[];
    feat?: string;
    languages?: ChoiceDetailJson;
    features: FeatureDetailJson[];
}

export interface SpellJson {
    id: string;
    name: string;
    description: string;
    duration: string;
    level: number; // existing 2024 file stores numeric; C# string property coerces
    range: string;
    casting_time: string;
    components: string;
    is_concentration: boolean;
    is_ritual: boolean;
    school: string;
    damage_type: string;
    page: string;
    is_material: boolean;
    is_somatic: boolean;
    is_verbal: boolean;
    materials_needed?: string;
    higherLevel?: string;
    classes: string[];
    subclasses: string[];
}

export interface ItemJson {
    id: string;
    name: string;
    desc: string;
    type: number; // 0 Weapon, 1 Armor, 2 Tool, 3 Item
    weight: number;
    cost: string;
    properties: Record<string, string | string[]>;
}

export interface MagicItemJson {
    id: string;
    name: string;
    desc: string;
    rarity: string;
    cost: string;
    category: string;
    weight: string;
    properties: { attunement?: string; effect?: string; charges?: string };
    metadata?: FeatureMetadataJson;
}

export interface WeaponMasteryJson {
    id: string;
    name: string;
    damage: string;
    properties: string[];
    mastery: string;
}

/** Everything produced for one ruleset, pre-ids/pre-mads. */
export interface RulesetData {
    classes: ClassJson[];
    subclasses: SubclassJson[];
    races: RaceJson[];
    subraces: SubraceJson[];
    backgrounds: BackgroundJson[];
    feats: FeatJson[];
    spells: SpellJson[];
    items: ItemJson[];
    weapons?: ItemJson[]; // 2014 only (separate file)
    armor?: ItemJson[];   // 2014 only (separate file)
    magicItems: MagicItemJson[];
    weaponMasteries?: WeaponMasteryJson[]; // 2024 only
}

export const ABILITY_ENUM: Record<string, number> = {
    strength: 0, dexterity: 1, constitution: 2, intelligence: 3, wisdom: 4, charisma: 5,
    str: 0, dex: 1, con: 2, int: 3, wis: 4, cha: 5,
};

export const CASTER_TYPE = { None: 0, Third: 1, Half: 2, Full: 3, Pact: 4 } as const;
export const ITEM_TYPE = { Weapon: 0, Armor: 1, Tool: 2, Item: 3 } as const;

/**
 * On-disk JSON shapes for SolidCharacters.Repository/data/srd/{2014,2024}.
 * These mirror the C# DTOs in SolidCharacters.Domain/Models/DTO/Class5e.cs using the
 * EXACT key casing found in the served files (snake_case where [JsonProperty] dictates,
 * camelCase otherwise). Newtonsoft reads case-insensitively, but we match the files.
 *
 * `legacy` (2014 → true, 2024 → false) is optional in these types because parsers must
 * NOT emit it — the central emit/stampLegacy.ts pass owns it, and validateLegacy hard-gates
 * its presence before write (same ownership model as ids/mads).
 *
 * `source` ("SRD 5.1" / "SRD 5.2") follows the same model: emit/stampSource.ts owns it,
 * validateSource hard-gates it, parsers must not emit it.
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
    legacy?: boolean;
    source?: string;
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
    legacy?: boolean;
    source?: string;
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
    legacy?: boolean;
    source?: string;
    name: string;
    parent_class: string;
    /** The parent class's id within the same ruleset — the canonical match key (parent_class stays for display). */
    parent_class_id?: string;
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
    legacy?: boolean;
    source?: string;
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
    legacy?: boolean;
    source?: string;
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
    legacy?: boolean;
    source?: string;
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
    legacy?: boolean;
    source?: string;
    name: string;
    desc: string;
    type: number; // 0 Weapon, 1 Armor, 2 Tool, 3 Item
    weight: number;
    cost: string;
    properties: Record<string, string | string[]>;
}

export interface MagicItemJson {
    id: string;
    legacy?: boolean;
    source?: string;
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
    legacy?: boolean;
    source?: string;
    name: string;
    damage: string;
    properties: string[];
    mastery: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rules dictionary + Monster statblock — mirror SolidCharacters.Domain/Models/DTO/StatBlock.cs
// ([JsonProperty] snake_case). `legacy` optional here (stamped centrally, like every entity).
// ─────────────────────────────────────────────────────────────────────────────

/** A flat rules-dictionary entry (e.g. "Jumping", "Cover"). Mirrors C# `Rule`. */
export interface RuleJson {
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

/** Ability score block — mirrors C# `Stats`. */
export interface StatsJson {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
}

/** Mirrors C# `Health`. Max is the listed HP; current/temp are runtime state. */
export interface HealthJson {
    max: number;
    current: number;
    temp: number;
}

/** Non-walking speeds in feet — mirrors C# `MovementSpeeds`. */
export interface MovementSpeedsJson {
    fly?: number;
    swim?: number;
    climb?: number;
    burrow?: number;
    hover?: boolean;
}

/** Special senses + ranges in feet — mirrors C# `CreatureSenses`. */
export interface CreatureSensesJson {
    darkvision?: number;
    blindsight?: number;
    tremorsense?: number;
    truesight?: number;
    passive_perception?: number;
}

/** Mirrors C# `SavingThrow`. Bonus derives = mod + (proficient ? PB : 0). */
export interface SavingThrowJson {
    stat: string; // "str".."cha"
    proficient: boolean;
}

/** Mirrors C# `SkillProficiency`. */
export interface SkillProficiencyJson {
    stat: string; // governing ability
    value: number; // computed modifier (statblocks list it)
    proficient: boolean;
    expertise: boolean;
}

/** Mirrors C# `CreatureProficiency`. */
export interface CreatureProficiencyJson {
    skills: Record<string, SkillProficiencyJson>;
    other: Record<string, boolean>;
}

/** Mirrors C# `DamageAffinity`, used for resistances/vulnerabilities/immunities. */
export interface DamageAffinityJson {
    type: string; // "fire", "slashing", ...
    value: boolean;
}

/** Mirrors C# `GrantedAction`: a named narrative action (no attack math). */
export interface GrantedActionJson {
    name: string;
    action_type: string; // "action" | "bonusAction" | "reaction"
    description?: string;
    source?: string;
}

/** Mirrors C# `RollAdvantage`. */
export interface RollAdvantageJson {
    roll_type: string;
    mode: string; // "advantage" | "disadvantage"
    stat?: string;
    condition?: string;
    source?: string;
}

/** Mirrors C# `RollBonus`. */
export interface RollBonusJson {
    roll_type: string;
    bonus?: number;
    proficiency_bonus?: string; // "Third PB" | "Half PB" | "Full PB"
    stat?: string;
    condition?: string;
    source?: string;
}

/** One damage component — mirrors C# `DamageEntry`. */
export interface DamageEntryJson {
    dice: string; // "2d6"
    type: string; // "Slashing", "Fire"
    add_ability_modifier: boolean; // primary weapon damage = true
    bonus?: number; // flat magic bonus (e.g. +1)
}

/** Save specifier for save-based attacks (breath weapons) — mirrors C# `MonsterSave`. */
export interface MonsterSaveJson {
    target_ability: string; // ability the TARGET rolls, e.g. "dex"
    dc_ability?: string; // monster ability that sets the DC (derive)
    dc_override?: number; // escape hatch when non-standard
    type: string; // "negates" | "half" | "none"
}

/** A monster's natural attack — mirrors C# `MonsterAttack`. To-hit + primary damage derive. */
export interface MonsterAttackJson {
    name: string;
    action_type: string; // "action" | "bonusAction" | "reaction"
    description?: string;
    attack_type?: string; // "melee" | "ranged" | "melee_or_ranged"
    ability?: string; // "str".."cha": drives derived to-hit + primary damage
    proficient?: boolean;
    to_hit_override?: number; // explicit total to-hit (non-standard)
    crit_threshold?: number;
    reach?: string;
    range?: string;
    save?: MonsterSaveJson; // present for save-based attacks
    target_count?: number;
    damage: DamageEntryJson[];
    count?: number; // times made per turn in a multiattack
    recharge?: string; // "5-6"
    uses?: string; // "1/Day"
}

/** A monster statblock, structured like the character model — mirrors C# `Monster`. */
export interface MonsterJson {
    id: string;
    legacy?: boolean;
    source?: string;
    name: string;
    size: string; // "Tiny".."Gargantuan"
    type: string; // creature type: "humanoid", "dragon"
    subtype?: string;
    alignment?: string;
    stats: StatsJson;
    armor_class: number;
    armor_desc?: string;
    health: HealthJson;
    hit_dice?: string; // "12d10+48"
    speed: number; // walking speed
    movement_speeds: MovementSpeedsJson;
    senses: CreatureSensesJson;
    saving_throws: SavingThrowJson[];
    proficiencies: CreatureProficiencyJson;
    resistances: DamageAffinityJson[];
    vulnerabilities: DamageAffinityJson[];
    immunities: DamageAffinityJson[];
    condition_immunities: string[];
    languages: string[];
    features: FeatureDetailJson[]; // passive/triggered traits
    granted_actions: GrantedActionJson[];
    roll_advantages: RollAdvantageJson[];
    roll_bonuses: RollBonusJson[];
    attacks: MonsterAttackJson[];
    attacks_per_action: number;
    legendary_actions?: MonsterAttackJson[];
    legendary_action_count?: number;
    challenge_rating: string; // "1/4", "6"
    proficiency_bonus?: number;
    xp?: number;
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
    rules: RuleJson[];
    monsters: MonsterJson[];
}

export const ABILITY_ENUM: Record<string, number> = {
    strength: 0, dexterity: 1, constitution: 2, intelligence: 3, wisdom: 4, charisma: 5,
    str: 0, dex: 1, con: 2, int: 3, wis: 4, cha: 5,
};

export const CASTER_TYPE = { None: 0, Third: 1, Half: 2, Full: 3, Pact: 4 } as const;
export const ITEM_TYPE = { Weapon: 0, Armor: 1, Tool: 2, Item: 3 } as const;

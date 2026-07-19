import type { MadMap } from "../spec.ts";

/**
 * Curated MADS commands for SRD 5.1 (2014) races AND subraces.
 * Keys are "<Race or Subrace Name>/<Trait Name>" (the trait name is the ***run label*** in the
 * Races_Each markdown). Only effects the trait text LITERALLY states are encoded.
 *
 * Deliberately SKIPPED (no catalog category can express them, or they are choice/situational):
 *  - Every "Ability Score Increase" trait — racial ability bonuses live in the structured
 *    `abilityBonuses` field; AddStats on a race/subrace trait is a hard lint error (see mads/apply.ts).
 *  - Trance, Halfling Nimbleness / Naturally Stealthy — no category.
 *  - Lucky (reroll a natural 1) and Savage Attacks (extra crit die) — not advantage, no category.
 *  - Stonecunning / Artificer's Lore — situational double-proficiency on a narrow check, not flat Expertise.
 *  - Languages: named tongues (Common/Elvish/Draconic...) already live in the `languages` field, and the
 *    "extra language of your choice" traits are choices — no Languages command is emitted.
 *  - Extra Language — "one extra language of your choice" with no bounded option list.
 *
 * Formerly skipped, now encoded: Dragonborn Damage Resistance (choice-form Resistances over the
 * Draconic Ancestry table's types) and High Elf Cantrip (choice-form Spells over the wizard
 * cantrip list); Infernal Legacy's 3rd/5th-level spells carry `level >=` prerequisites.
 */

/** Character-level gate for spells granted at a later character level. */
const atLevel = (keyValue: string) =>
    [{ value: "level", operation: ">=", keyValue, group: 0 }];

/** "You can see in dim light within 60 feet of you..." — every 5.1 Darkvision trait is 60 ft. */
const DARKVISION_60 = { type: "Add", category: "Senses", value: { sense: "darkvision", range: "60" } } as const;
export const map: MadMap = {
    // Dwarf — "advantage on saving throws against poison, and resistance against poison damage".
    // 5.1 does not name a specific ability for the poison save → omit `stat`, use a condition.
    "Dwarf/Dwarven Resilience": [
        { type: "Add", category: "Resistances", value: { damageType: "Poison" } },
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against poison" } },
    ],
    "Dwarf/Darkvision": [DARKVISION_60],

    // Dwarf — "proficiency with the battleaxe, handaxe, light hammer, and warhammer."
    "Dwarf/Dwarven Combat Training": [
        { type: "Add", category: "WeaponProficiencies", value: { weapon: "Battleaxes" } },
        { type: "Add", category: "WeaponProficiencies", value: { weapon: "Handaxes" } },
        { type: "Add", category: "WeaponProficiencies", value: { weapon: "Light Hammers" } },
        { type: "Add", category: "WeaponProficiencies", value: { weapon: "Warhammers" } },
    ],

    // Dwarf — "proficiency with the artisan's tools of your choice: smith's tools, brewer's supplies, or mason's tools."
    "Dwarf/Tool Proficiency": [
        { type: "Add", category: "ToolProficiencies", value: {
            tool: "choice",
            options: "Smith's Tools,Brewer's Supplies,Mason's Tools",
            count: "1",
        } },
    ],

    // Hill Dwarf — "Your hit point maximum increases by 1, and it increases by 1 every time you gain a level."
    "Hill Dwarf/Dwarven Toughness": [
        { type: "Add", category: "HitPoints", value: { amount: "1", perLevel: "true" } },
    ],

    // Dragonborn — "After you use your breath weapon, you can't use it again until you complete a
    // short or long rest." Recharges on a short rest (the shorter cadence).
    "Dragonborn/Breath Weapon": [
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Short Rest" } },
    ],

    // Elf — "You have proficiency in the Perception skill."
    "Elf/Keen Senses": [
        { type: "Add", category: "Proficiencies", value: { proficiency: "Perception" } },
    ],
    // Elf — "advantage on saving throws against being charmed" (magic-can't-sleep part has no category).
    "Elf/Fey Ancestry": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against being charmed" } },
    ],
    "Elf/Darkvision": [DARKVISION_60],

    // High Elf — "proficiency with the longsword, shortsword, shortbow, and longbow."
    "High Elf/Elf Weapon Training": [
        { type: "Add", category: "WeaponProficiencies", value: { weapon: "Longswords" } },
        { type: "Add", category: "WeaponProficiencies", value: { weapon: "Shortswords" } },
        { type: "Add", category: "WeaponProficiencies", value: { weapon: "Shortbows" } },
        { type: "Add", category: "WeaponProficiencies", value: { weapon: "Longbows" } },
    ],

    // Half-Elf shares Fey Ancestry verbatim.
    "Half-Elf/Fey Ancestry": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against being charmed" } },
    ],
    "Half-Elf/Darkvision": [DARKVISION_60],

    // Halfling — "You have advantage on saving throws against being frightened."
    "Halfling/Brave": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against being frightened" } },
    ],

    // Gnome — "advantage on all Intelligence, Wisdom, and Charisma saving throws against magic":
    // one Advantage command per ability, each qualified with the "against magic" condition.
    "Gnome/Gnome Cunning": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", stat: "int", condition: "against magic" } },
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", stat: "wis", condition: "against magic" } },
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", stat: "cha", condition: "against magic" } },
    ],
    "Gnome/Darkvision": [DARKVISION_60],

    // Rock Gnome — "You have proficiency with artisan's tools (tinker's tools)."
    "Rock Gnome/Tinker": [
        { type: "Add", category: "ToolProficiencies", value: { tool: "Tinker's Tools" } },
    ],

    // Half-Orc — "You gain proficiency in the Intimidation skill."
    "Half-Orc/Menacing": [
        { type: "Add", category: "Proficiencies", value: { proficiency: "Intimidation" } },
    ],
    // Half-Orc — "You can't use this feature again until you finish a long rest."
    "Half-Orc/Relentless Endurance": [
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Long Rest" } },
    ],
    "Half-Orc/Darkvision": [DARKVISION_60],

    // Tiefling — "You have resistance to fire damage."
    "Tiefling/Hellish Resistance": [
        { type: "Add", category: "Resistances", value: { damageType: "Fire" } },
    ],
    "Tiefling/Darkvision": [DARKVISION_60],

    // ================================================================
    // Coverage-gap sweep (July 2026): entries below were proposed and
    // adversarially verified against the parsed SRD text.
    // ================================================================
    // 'You gain proficiency in two skills of your choice' → rule 6 choice-form Proficiencies, all 18 canonical skills as options, count 2 (mirrors the count
    "Half-Elf/Skill Versatility": [
        { type: "Add", category: "Proficiencies", value: { proficiency: "choice", options: "Acrobatics,Animal Handling,Arcana,History,Athletics,Deception,Insight,Intimidation,Investigation,Medicine,Nature,Perception,Performance,Persuasion,Religion,Sleight Of Hand,Stealth,Survival", count: "2" } },
    ],
    // Encode intent is correct: verified the text grants FIXED named spells (thaumaturgy cantrip known; hellish rebuke at 3rd level; darkness at 5th level)
    "Tiefling/Infernal Legacy": [
        { type: "Add", category: "Spells", value: {  }, target: "thaumaturgy" },
        { type: "Add", category: "Spells", value: {  }, target: "hellish rebuke", prerequisites: atLevel("3") },
        { type: "Add", category: "Spells", value: {  }, target: "darkness", prerequisites: atLevel("5") },
    ],

    // ================================================================
    // Choice encodings (July 2026): choice-form commands replaced the
    // former documented skips below.
    // ================================================================

    // "You have resistance to the damage type associated with your draconic ancestry." — the
    // Draconic Ancestry table's distinct damage types, picked on the sheet.
    "Dragonborn/Damage Resistance": [
        { type: "Add", category: "Resistances", value: { damageType: "choice", options: "Acid,Cold,Fire,Lightning,Poison", count: "1" } },
    ],

    // High Elf — "You know one cantrip of your choice from the wizard spell list." All 14 SRD 5.1
    // wizard cantrips as options (Intelligence-casting clause stays narrative).
    "High Elf/Cantrip": [
        { type: "Add", category: "Spells", value: {
            ID: "choice",
            options: "Acid Splash,Chill Touch,Dancing Lights,Fire Bolt,Light,Mage Hand,Mending,Message,Minor Illusion,Poison Spray,Prestidigitation,Ray of Frost,Shocking Grasp,True Strike",
            count: "1",
            spellLevel: "0",
        } },
    ],
};

/*
 * Coverage-gap sweep (July 2026) — documented SKIPS (verified; no fitting category or
 * deliberately out of scope per the decision rules):
 *  - Dwarf/Stonecunning: Situational double-proficiency: 'you are considered proficient in the History skill and add double your proficiency bonus' only for Int(History) check
 * (Former entries in this block — Dwarven Combat Training, Tool Proficiency, Damage Resistance,
 * Elf Weapon Training, Tinker — are all encoded in the map above.)
 */

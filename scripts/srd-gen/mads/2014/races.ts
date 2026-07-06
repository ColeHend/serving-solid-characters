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
 *  - Dwarven Combat Training / "High Elf/Elf Weapon Training" / Tinker / Tool Proficiency — grant WEAPON or
 *    TOOL proficiency; the Proficiencies category only covers SKILLS, so there is no command for them.
 *  - Languages: named tongues (Common/Elvish/Draconic...) already live in the `languages` field, and the
 *    "extra language of your choice" traits are choices — no Languages command is emitted.
 *  - Draconic Ancestry / Damage Resistance (Dragonborn): the resisted damage type is CHOICE-dependent
 *    (picked from the Draconic Ancestry table), so no fixed Resistances command can be authored.
 *  - Infernal Legacy, Cantrip, Extra Language — spell/language choices.
 */

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
        { type: "Add", category: "Spells", value: {  }, target: "hellish rebuke" },
        { type: "Add", category: "Spells", value: {  }, target: "darkness" },
    ],
};

/*
 * Coverage-gap sweep (July 2026) — documented SKIPS (verified; no fitting category or
 * deliberately out of scope per the decision rules):
 *  - Dwarf/Dwarven Combat Training: Grants WEAPON proficiency ('proficiency with the battleaxe, handaxe, light hammer, and warhammer'); the Proficiencies category covers SKILLS only and 
 *  - Dwarf/Tool Proficiency: Grants a CHOICE of artisan's TOOL proficiency ('smith's tools, brewer's supplies, or mason's tools'); Proficiencies is skills-only and no tool-profici
 *  - Dwarf/Stonecunning: Situational double-proficiency: 'you are considered proficient in the History skill and add double your proficiency bonus' only for Int(History) check
 *  - Dragonborn/Damage Resistance: 'resistance to the damage type associated with your draconic ancestry' — the resisted type is CHOICE-dependent (picked from the Draconic Ancestry tabl
 *  - High Elf/Elf Weapon Training: Text: "You have proficiency with the longsword, shortsword, shortbow, and longbow." These are WEAPON proficiencies; the Proficiencies category covers 
 *  - Rock Gnome/Tinker: Text: "You have proficiency with artisan's tools (tinker's tools)..." plus a temporary clockwork-device construction ability. Tool proficiency has no 
 */

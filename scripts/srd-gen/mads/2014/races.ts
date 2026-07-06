import type { MadMap } from "../spec.ts";

/**
 * Curated MADS commands for SRD 5.1 (2014) races AND subraces.
 * Keys are "<Race or Subrace Name>/<Trait Name>" (the trait name is the ***run label*** in the
 * Races_Each markdown). Only effects the trait text LITERALLY states are encoded.
 *
 * Deliberately SKIPPED (no catalog category can express them, or they are choice/situational):
 *  - Every "Ability Score Increase" trait — racial ability bonuses live in the structured
 *    `abilityBonuses` field; AddStats on a race/subrace trait is a hard lint error (see mads/apply.ts).
 *  - Darkvision, Trance, Halfling Nimbleness / Naturally Stealthy, mixed movement — no category.
 *  - Lucky (reroll a natural 1) and Savage Attacks (extra crit die) — not advantage, no category.
 *  - Stonecunning / Artificer's Lore — situational double-proficiency on a narrow check, not flat Expertise.
 *  - Dwarven Combat Training / "High Elf/Elf Weapon Training" / Tinker / Tool Proficiency — grant WEAPON or
 *    TOOL proficiency; the Proficiencies category only covers SKILLS, so there is no command for them.
 *  - Languages: named tongues (Common/Elvish/Draconic...) already live in the `languages` field, and the
 *    "extra language of your choice" traits are choices — no Languages command is emitted.
 *  - Draconic Ancestry / Damage Resistance (Dragonborn): the resisted damage type is CHOICE-dependent
 *    (picked from the Draconic Ancestry table), so no fixed Resistances command can be authored.
 *  - Infernal Legacy, Cantrip, Extra Language, Dwarven Toughness (HP-max) — spell choices / HP max, no category.
 */
export const map: MadMap = {
    // Dwarf — "advantage on saving throws against poison, and resistance against poison damage".
    // 5.1 does not name a specific ability for the poison save → omit `stat`, use a condition.
    "Dwarf/Dwarven Resilience": [
        { type: "Add", category: "Resistances", value: { damageType: "Poison" } },
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against poison" } },
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

    // Half-Elf shares Fey Ancestry verbatim.
    "Half-Elf/Fey Ancestry": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against being charmed" } },
    ],

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

    // Half-Orc — "You gain proficiency in the Intimidation skill."
    "Half-Orc/Menacing": [
        { type: "Add", category: "Proficiencies", value: { proficiency: "Intimidation" } },
    ],
    // Half-Orc — "You can't use this feature again until you finish a long rest."
    "Half-Orc/Relentless Endurance": [
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Long Rest" } },
    ],

    // Tiefling — "You have resistance to fire damage."
    "Tiefling/Hellish Resistance": [
        { type: "Add", category: "Resistances", value: { damageType: "Fire" } },
    ],
};

import type { MadMap } from "../spec.ts";

/**
 * Curated MADS commands for SRD 5.2 (2024) magic items. Keys are the exact item names (10_MagicItems.md).
 * Only permanent, literally-stated, while-worn/held effects are encoded. Commands attach to the item's
 * metadata.mads (mads/apply.ts). Value fields are all strings.
 *
 * Deliberately SKIPPED (choice-dependent, situational, or no catalog category):
 *  - Belt of Giant Strength — Strength is SET to a score that VARIES by giant type (21/23/25/27/29);
 *    the single parsed item can't carry one fixed value, so no Stats command is authored.
 *  - Armor of Resistance / Ring of Resistance / Dragon Scale Mail (resistance part) / Ring of Elemental
 *    Command / Helm of Brilliance — the resisted damage type is a GM/gem/dragon/element CHOICE.
 *  - Ring of Protection, Cloak of Protection, Scarab of Protection (+1 AC), Ring of Warmth (reduces Cold
 *    damage by 2d8, not full Resistance), +N Armor/Shield/Weapon/Ammunition — a flat AC/attack bonus or
 *    partial reduction has no catalog category.
 *  - Potions (Giant Strength, Resistance, Healing, Climbing, ...) — consumable/temporary, no permanent effect.
 *  - Immunity to a spell's damage (Brooch of Shielding's Magic Missile immunity) — not a damage TYPE.
 *  - Winged Boots (charge-activated 1-hour flight) / Wings of Flying (Magic-action wings) — activated,
 *    temporary flight; Broom of Flying (the broom flies, not you); Boots of Speed (double speed — a
 *    multiplier, and click-heel activated) — not representable.
 *  - Eyes of Minute Seeing — Darkvision within 1 FOOT (a close-inspection gimmick; putting a 1-ft
 *    sense on the sheet would mislead) — only the Investigation advantage is encoded.
 */
export const map: MadMap = {
    // ---- Ability-score SETTERS ("Your <ability> is 19 while you wear this") ----
    "Amulet of Health": [
        { type: "Add", category: "Stats", value: { stat: "con", statValue: "19", mode: "set" } },
    ],
    "Gauntlets of Ogre Power": [
        { type: "Add", category: "Stats", value: { stat: "str", statValue: "19", mode: "set" } },
    ],
    "Headband of Intellect": [
        { type: "Add", category: "Stats", value: { stat: "int", statValue: "19", mode: "set" } },
    ],

    // ---- Manuals & Tomes ("your <ability> increases by 2, to a maximum of 30") ----
    "Manual of Bodily Health": [
        { type: "Add", category: "Stats", value: { stat: "con", statValue: "2" } },
    ],
    "Manual of Gainful Exercise": [
        { type: "Add", category: "Stats", value: { stat: "str", statValue: "2" } },
    ],
    "Manual of Quickness of Action": [
        { type: "Add", category: "Stats", value: { stat: "dex", statValue: "2" } },
    ],
    "Tome of Clear Thought": [
        { type: "Add", category: "Stats", value: { stat: "int", statValue: "2" } },
    ],
    "Tome of Leadership and Influence": [
        { type: "Add", category: "Stats", value: { stat: "cha", statValue: "2" } },
    ],
    "Tome of Understanding": [
        { type: "Add", category: "Stats", value: { stat: "wis", statValue: "2" } },
    ],

    // Belt of Dwarvenkind — Con +2, Poison Resistance, poison-save Advantage, Persuasion Advantage vs
    // dwarves, and knows Dwarvish. Darkvision 60 sits in the same "if you aren't a dwarf or duergar"
    // block as the already-encoded Resilience benefits, so it is encoded the same way.
    "Belt of Dwarvenkind": [
        { type: "Add", category: "Stats", value: { stat: "con", statValue: "2" } },
        { type: "Add", category: "Resistances", value: { damageType: "Poison" } },
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "avoid or end the Poisoned condition" } },
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", stat: "cha", condition: "Charisma (Persuasion) checks made to interact with dwarves and duergar" } },
        { type: "Add", category: "Languages", value: { name: "Dwarvish" } },
        { type: "Add", category: "Senses", value: { sense: "darkvision", range: "60" } },
    ],

    // ---- Movement modes (permanent while worn) ----
    // "your Speed becomes 30 feet" — the "unless your Speed is higher" carve-out isn't representable.
    "Boots of Striding and Springing": [
        { type: "Add", category: "Speed", value: { speed: "30", mode: "set" } },
    ],
    "Ring of Swimming": [
        { type: "Add", category: "Movement", value: { movementType: "swim", speed: "40" } },
    ],
    "Cloak of the Manta Ray": [
        { type: "Add", category: "Movement", value: { movementType: "swim", speed: "60" } },
    ],
    "Slippers of Spider Climbing": [
        { type: "Add", category: "Movement", value: { movementType: "climb" } },
    ],
    // "you have a Climb Speed and a Swim Speed equal to your Speed" (+5 to Athletics for
    // climbing/swimming is a flat check bonus — no category).
    "Gloves of Swimming and Climbing": [
        { type: "Add", category: "Movement", value: { movementType: "climb" } },
        { type: "Add", category: "Movement", value: { movementType: "swim" } },
    ],

    // ---- Senses (permanent while worn) ----
    "Goggles of Night": [
        { type: "Add", category: "Senses", value: { sense: "darkvision", range: "60" } },
    ],

    // ---- Fixed-type damage Resistance (while worn/held) ----
    "Armor of Invulnerability": [
        { type: "Add", category: "Resistances", value: { damageType: "Bludgeoning" } },
        { type: "Add", category: "Resistances", value: { damageType: "Piercing" } },
        { type: "Add", category: "Resistances", value: { damageType: "Slashing" } },
    ],
    "Boots of the Winterlands": [
        { type: "Add", category: "Resistances", value: { damageType: "Cold" } },
    ],
    "Brooch of Shielding": [
        { type: "Add", category: "Resistances", value: { damageType: "Force" } },
    ],
    // (also "Spider Climb. You have a Climb Speed equal to your Speed...")
    "Cloak of Arachnida": [
        { type: "Add", category: "Resistances", value: { damageType: "Poison" } },
        { type: "Add", category: "Movement", value: { movementType: "climb" } },
    ],
    "Frost Brand": [
        { type: "Add", category: "Resistances", value: { damageType: "Fire" } },
    ],
    "Staff of Fire": [
        { type: "Add", category: "Resistances", value: { damageType: "Fire" } },
    ],
    "Staff of Frost": [
        { type: "Add", category: "Resistances", value: { damageType: "Cold" } },
    ],

    // ---- Fixed-type Immunity ----
    // "Immunity to the Poisoned condition and Poison damage" — the Poison-damage immunity is encodable.
    "Periapt of Proof against Poison": [
        { type: "Add", category: "Immunities", value: { damageType: "Poison" } },
    ],

    // ---- Advantage on ability checks (fixed, while worn) ----
    "Cloak of Elvenkind": [
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", condition: "Dexterity (Stealth) checks" } },
    ],
    "Boots of Elvenkind": [
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", condition: "Dexterity (Stealth) checks" } },
    ],
    "Eyes of the Eagle": [
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", condition: "Wisdom (Perception) checks that rely on sight" } },
    ],
    // (also "Special Senses. You have Darkvision and Truesight, both with a range of 120 feet.")
    "Robe of Eyes": [
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", condition: "Wisdom (Perception) checks that rely on sight" } },
        { type: "Add", category: "Senses", value: { sense: "darkvision", range: "120" } },
        { type: "Add", category: "Senses", value: { sense: "truesight", range: "120" } },
    ],
    "Eyes of Minute Seeing": [
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", condition: "Intelligence (Investigation) checks made to examine something within 1 foot" } },
    ],
    "Cloak of the Bat": [
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", condition: "Dexterity (Stealth) checks" } },
    ],
    // "While holding the rod, you have Advantage on Wisdom (Perception) checks and on Initiative rolls."
    "Rod of Alertness": [
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", condition: "Wisdom (Perception) checks" } },
        { type: "Add", category: "Advantage", value: { rollType: "Initiative", mode: "advantage" } },
    ],
    // "Supernatural Readiness. Each subject has Advantage on its Initiative rolls." (wielder's own
    // benefit; the 30-foot ally radius isn't representable)
    "Weapon of Warning": [
        { type: "Add", category: "Advantage", value: { rollType: "Initiative", mode: "advantage" } },
    ],

    // ---- Advantage on saving throws (fixed condition) ----
    "Mantle of Spell Resistance": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against spells" } },
    ],
    "Necklace of Adaptation": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "avoid or end the Poisoned condition" } },
    ],
    "Periapt of Health": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "avoid or end the Poisoned condition" } },
    ],
    "Ring of Spell Turning": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against spells" } },
    ],
    "Scarab of Protection": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against spells" } },
    ],
    "Spellguard Shield": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against spells and other magical effects" } },
    ],
    "Staff of the Magi": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against spells" } },
    ],
    "Holy Avenger": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against spells and other magical effects" } },
    ],
    // Dragon Scale Mail — the resistance is dragon-type-dependent (skipped); this Advantage is fixed.
    "Dragon Scale Mail": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against the breath weapons of Dragons" } },
    ],

    // Robe of the Archmagi — unarmored base AC 15 + Dex, plus Advantage on saves vs spells/magic.
    // (The +2 to spell save DC / spell attack bonus has no category.)
    "Robe of the Archmagi": [
        { type: "Add", category: "ArmorClass", value: { bonus: "15", stats: "dex" } },
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against spells and other magical effects" } },
    ],
};

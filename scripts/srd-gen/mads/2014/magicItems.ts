import type { MadMap } from "../spec.ts";

/**
 * Curated MADS commands for SRD 5.1 (2014) magic items. Keys are the EXACT item name (H3 title in
 * Magic_Items_Each/*.md). Attached to item.metadata.mads. Only text-literal, character-sheet-relevant
 * mechanical effects are encoded — active/charged spells, movement modes, and flavor are skipped.
 *
 * Deliberately SKIPPED (each would need a category the catalog doesn't have, or the value varies):
 *  - Belt of Giant Strength — one item covering six giant types (Str 21/23/25/27/29); the set score
 *    varies by variety, so no single Stats-set value is correct.
 *  - Ring of Protection / Cloak of Protection — "+1 to AC and saving throws": a FLAT AC bonus has no
 *    category (ArmorClass takes a bonus+ability FORMULA, not a flat add), so it can't be encoded.
 *  - +1/+2/+3 armor & shields, Bracers of Defense, Dwarven Plate, Glamoured Studded Leather — flat AC bonus.
 *  - Armor of Resistance / Ring of Resistance / Potion of Resistance / Dragon Scale Mail — resisted damage
 *    type varies by table/choice; Armor of Invulnerability resists "nonmagical" damage (not a damage type).
 *  - Boots of Striding and Springing (walking speed becomes 30), Ring of Swimming (swim speed 40), Boots of
 *    Speed (double speed), Winged/Flying boots — Speed only applies a delta, not a set/flight, so skipped.
 *  - Stone of Good Luck / Luck Blade / Robe of Stars — flat numeric bonus to checks/saves, no category.
 *  - Ioun Stone — one item covering many variants (some set ability scores), so no single command fits.
 *  - Periapt of Health (disease immunity), Ring of Free Action (condition immunity) — not damage-type immunities.
 */
export const map: MadMap = {
    // ---- Score-SETTING items: "your <ability> score is 19 while you wear this" ----
    "Amulet of Health": [
        { type: "Add", category: "Stats", value: { stat: "con", statValue: "19", mode: "set" } },
    ],
    "Gauntlets of Ogre Power": [
        { type: "Add", category: "Stats", value: { stat: "str", statValue: "19", mode: "set" } },
    ],
    "Headband of Intellect": [
        { type: "Add", category: "Stats", value: { stat: "int", statValue: "19", mode: "set" } },
    ],

    // ---- Manuals & Tomes: "+2 to <ability>, as does your maximum" ----
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

    // Belt of Dwarvenkind — "Constitution score increases by 2, to a maximum of 20" and
    // "advantage on Charisma (Persuasion) checks made to interact with dwarves".
    // The poison resistance / darkvision / Dwarvish are gated on "if you aren't a dwarf" → skipped.
    "Belt of Dwarvenkind": [
        { type: "Add", category: "Stats", value: { stat: "con", statValue: "2" } },
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", condition: "Charisma (Persuasion) checks made to interact with dwarves" } },
    ],

    // ---- Damage resistances (fixed type stated in the text) ----
    "Cloak of Arachnida": [
        { type: "Add", category: "Resistances", value: { damageType: "Poison" } },
    ],
    "Boots of the Winterlands": [
        { type: "Add", category: "Resistances", value: { damageType: "Cold" } },
    ],
    "Ring of Warmth": [
        { type: "Add", category: "Resistances", value: { damageType: "Cold" } },
    ],
    "Brooch of Shielding": [
        { type: "Add", category: "Resistances", value: { damageType: "Force" } },
    ],
    // "while you hold the sword, you have resistance to fire damage"
    "Frost Brand": [
        { type: "Add", category: "Resistances", value: { damageType: "Fire" } },
    ],
    // "You have resistance to fire damage while you hold this staff."
    "Staff of Fire": [
        { type: "Add", category: "Resistances", value: { damageType: "Fire" } },
    ],
    // "You have resistance to cold damage while you hold this staff."
    "Staff of Frost": [
        { type: "Add", category: "Resistances", value: { damageType: "Cold" } },
    ],

    // ---- Damage immunities (fixed type stated in the text) ----
    // "immunity to poison damage" (the poisoned-condition immunity has no category).
    "Periapt of Proof against Poison": [
        { type: "Add", category: "Immunities", value: { damageType: "Poison" } },
    ],

    // ---- Advantage on ability checks (skill-specific, stated verbatim) ----
    "Eyes of the Eagle": [
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", condition: "Wisdom (Perception) checks that rely on sight" } },
    ],
    "Eyes of Minute Seeing": [
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", condition: "Intelligence (Investigation) checks that rely on sight" } },
    ],
    "Cloak of Elvenkind": [
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", condition: "Dexterity (Stealth) checks made to hide" } },
    ],
    "Boots of Elvenkind": [
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", condition: "Dexterity (Stealth) checks that rely on moving silently" } },
    ],
    "Robe of Eyes": [
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", condition: "Wisdom (Perception) checks that rely on sight" } },
    ],

    // "While wearing this cloak, you have advantage on Dexterity (Stealth) checks."
    "Cloak of the Bat": [
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", condition: "Dexterity (Stealth) checks" } },
    ],
    // "While holding the rod, you have advantage on Wisdom (Perception) checks and on rolls for initiative."
    "Rod of Alertness": [
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", condition: "Wisdom (Perception) checks" } },
        { type: "Add", category: "Advantage", value: { rollType: "Initiative", mode: "advantage" } },
    ],

    // ---- Advantage on saving throws (stated verbatim) ----
    "Necklace of Adaptation": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against harmful gases and vapors" } },
    ],
    "Mantle of Spell Resistance": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against spells" } },
    ],
    "Spellguard Shield": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against spells and other magical effects" } },
    ],
    "Scarab of Protection": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against spells" } },
    ],

    // Robe of the Archmagi — "If you aren't wearing armor, your base Armor Class is 15 + your Dexterity
    // modifier" (an AC FORMULA → ArmorClass) plus "advantage on saving throws against spells and other
    // magical effects". The +2 spell save DC / attack bonus has no category.
    "Robe of the Archmagi": [
        { type: "Add", category: "ArmorClass", value: { bonus: "15", stats: "dex" } },
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against spells and other magical effects" } },
    ],
};

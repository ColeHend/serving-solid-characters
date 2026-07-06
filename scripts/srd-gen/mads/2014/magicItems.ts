import type { CommandSpecInput, MadMap } from "../spec.ts";

/**
 * Curated MADS commands for SRD 5.1 (2014) magic items. Keys are the EXACT item name (H3 title in
 * Magic_Items_Each/*.md) — or, for entries the variant pass splits (mads/variants.ts), the exact
 * SPLIT names ("Weapon, +1", "Belt of Giant Strength (Hill)", "Armor of Resistance (Acid)", ...).
 * Attached to item.metadata.mads. Only text-literal, character-sheet-relevant mechanical effects are
 * encoded — active/charged spells and flavor are skipped. (A few classic items have truncated descs
 * in the parsed markdown — Dragon Scale Mail, Stone of Good Luck; their entries follow the SRD 5.1
 * rules text, same precedent as Scarab of Protection.)
 *
 * Deliberately SKIPPED (each would need a category the catalog doesn't have, or the value varies):
 *  - Damage halves of "+N to attack and damage rolls" items — damage is not a d20 roll or sheet stat;
 *    only the attack-roll RollBonus is encoded. Same for on-hit riders (Frost Brand's 1d6 cold,
 *    Giant Slayer's 2d6, Holy Avenger's 2d10) and Defender's attack→AC reallocation.
 *  - Wand of the War Mage's "ignore half cover" rider; Scimitar of Speed's bonus-action attack
 *    (not an extra Attack-action attack, so Attacks would misstate it); Luck Blade's Wish/Luck charges.
 *  - Dragon Scale Mail's resistance part — the damage type varies by dragon kind on a single item
 *    (unlike Armor/Ring of Resistance, whose table is split into concrete variants by mads/variants.ts).
 *  - Armor of Invulnerability resists "nonmagical" damage (not a damage type).
 *  - Boots of Speed (double speed — a multiplier, and click-heel activated) — not representable.
 *  - Wings of Flying (command-word, 1 hour, 1d12h cooldown), Potion of Climbing / Potion of Flying /
 *    Potion of Giant Strength / Potion of Resistance (consumables), Broom of Flying / Carpet of Flying
 *    (the OBJECT flies, not your speed), Cloak of the Bat (fly only in dim light gripping the cloak),
 *    Ring of Elemental Command (benefits vary by ring element) — activated/temporary/variant, skipped.
 *  - Ioun Stone — one item covering many variants (some set ability scores), so no single command fits.
 *  - Periapt of Health (disease immunity), Ring of Free Action (condition immunity) — not damage-type immunities.
 */

// ---- tiny authoring helpers (all value fields are strings) ----
const add = (category: string, value: Record<string, string>): CommandSpecInput => ({ type: "Add", category, value });
const attackBonus = (bonus: string, condition?: string): CommandSpecInput =>
    add("RollBonus", { rollType: "WeaponAttack", bonus, ...(condition ? { condition } : {}) });
const spellAttackBonus = (bonus: string): CommandSpecInput => add("RollBonus", { rollType: "SpellAttack", bonus });
const saveBonus = (bonus: string): CommandSpecInput => add("RollBonus", { rollType: "SavingThrow", bonus });
const checkBonus = (bonus: string): CommandSpecInput => add("RollBonus", { rollType: "AbilityCheck", bonus });
const flatAC = (bonus: string, condition?: string): CommandSpecInput =>
    add("ArmorClass", { bonus, ...(condition ? { condition } : {}) });
const setStr = (score: string): CommandSpecInput => add("Stats", { stat: "str", statValue: score, mode: "set" });
const resist = (damageType: string): CommandSpecInput => add("Resistances", { damageType });

// One entry per split "+N" item ("Weapon, +1" … "Weapon, +3").
const plusFamily = (family: string, cmd: (n: string) => CommandSpecInput): MadMap =>
    Object.fromEntries(["1", "2", "3"].map(n => [`${family}, +${n}`, [cmd(n)]]));

// One fixed Resistance per split Armor/Ring of Resistance variant (see variants.ts).
const RESISTANCE_TYPES = ["Acid", "Cold", "Fire", "Force", "Lightning", "Necrotic", "Poison", "Psychic", "Radiant", "Thunder"];
const resistanceFamily = (family: string): MadMap =>
    Object.fromEntries(RESISTANCE_TYPES.map(t => [`${family} (${t})`, [resist(t)]]));

// Str score per split Belt of Giant Strength variant (the SRD belt table).
const BELT_SCORES: [string, string][] = [["Hill", "21"], ["Stone", "23"], ["Frost", "23"], ["Fire", "25"], ["Cloud", "27"], ["Storm", "29"]];
const beltFamily = (): MadMap =>
    Object.fromEntries(BELT_SCORES.map(([type, score]) => [`Belt of Giant Strength (${type})`, [setStr(score)]]));

export const map: MadMap = {
    // ---- Split-variant items (concrete entries produced by mads/variants.ts) ----
    // "+N to attack rolls and damage rolls" — attack half only (damage has no command).
    ...plusFamily("Weapon", attackBonus),
    ...plusFamily("Ammunition", attackBonus),
    // "+N bonus to AC" (a shield's normal +2 lives on the mundane item, not here).
    ...plusFamily("Armor", flatAC),
    ...plusFamily("Shield", flatAC),
    // "+N bonus to spell attack rolls" (ignore-half-cover rider → skip).
    ...plusFamily("Wand of the War Mage", spellAttackBonus),
    ...beltFamily(),
    ...resistanceFamily("Armor of Resistance"),
    ...resistanceFamily("Ring of Resistance"),

    // ---- Flat AC / save / check bonuses (while worn or held) ----
    "Ring of Protection": [flatAC("1"), saveBonus("1")],
    "Cloak of Protection": [flatAC("1"), saveBonus("1")],
    "Bracers of Defense": [flatAC("2", "while wearing no armor and using no shield")],
    "Dwarven Plate": [flatAC("2")],
    "Glamoured Studded Leather": [flatAC("1")],
    // "+1 bonus to ability checks and saving throws" (SRD text; parsed desc is truncated).
    "Stone of Good Luck (Luckstone)": [checkBonus("1"), saveBonus("1")],
    "Robe of Stars": [saveBonus("1")],

    // ---- Named "+N" weapons (attack half only; riders noted in the header) ----
    "Scimitar of Speed": [attackBonus("2")],
    "Giant Slayer": [attackBonus("1")],
    "Defender": [attackBonus("3")],
    "Luck Blade": [attackBonus("1"), saveBonus("1")],
    // "+3 bonus to attack and damage rolls" plus advantage vs spells and magical effects (holy aura).
    "Holy Avenger": [
        attackBonus("3"),
        add("Advantage", { rollType: "SavingThrow", mode: "advantage", condition: "against spells and other magical effects" }),
    ],
    // "+2 to attack and damage rolls made with it" as a quarterstaff, "+2 bonus to spell attack rolls" held,
    // plus advantage on saving throws against spells.
    "Staff of the Magi": [
        attackBonus("2", "when wielded as a quarterstaff"),
        spellAttackBonus("2"),
        add("Advantage", { rollType: "SavingThrow", mode: "advantage", condition: "against spells" }),
    ],
    // "+1 bonus to AC, advantage on saving throws against the Frightful Presence and breath weapons of
    // dragons" (SRD text; parsed desc is truncated; the by-dragon-kind resistance → skip).
    "Dragon Scale Mail": [
        flatAC("1"),
        add("Advantage", { rollType: "SavingThrow", mode: "advantage", condition: "against the Frightful Presence and breath weapons of dragons" }),
    ],

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

    // ---- Movement modes (permanent while worn) ----
    // "your walking speed becomes 30 feet" — the "unless your walking speed is higher" carve-out
    // isn't representable; encoded as a plain set.
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
    // "While you wear these boots, you have a flying speed equal to your walking speed."
    // (The 4-hours-of-flight budget isn't representable.)
    "Winged Boots": [
        { type: "Add", category: "Movement", value: { movementType: "fly" } },
    ],

    // ---- Senses (permanent while worn) ----
    "Goggles of Night": [
        { type: "Add", category: "Senses", value: { sense: "darkvision", range: "60" } },
    ],

    // ---- Damage resistances (fixed type stated in the text) ----
    // (also "a climbing speed equal to your walking speed" while wearing the cloak)
    "Cloak of Arachnida": [
        { type: "Add", category: "Resistances", value: { damageType: "Poison" } },
        { type: "Add", category: "Movement", value: { movementType: "climb" } },
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
    // (also "You have darkvision out to a range of 120 feet"; the see-invisible/ethereal part has no category)
    "Robe of Eyes": [
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", condition: "Wisdom (Perception) checks that rely on sight" } },
        { type: "Add", category: "Senses", value: { sense: "darkvision", range: "120" } },
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

    // ================================================================
    // Coverage-gap sweep (July 2026): entries below were proposed and
    // adversarially verified against the parsed SRD text.
    // ================================================================
    // "You gain a +2 bonus to AC against ranged attacks while you wield this shield" → ArmorClass bonus-only with condition, matching the flatAC-with-condit
    "Arrow-Catching Shield": [
        { type: "Add", category: "ArmorClass", value: { bonus: "2", condition: "against ranged attacks" } },
    ],
    // "+1 bonus to attack and damage rolls" → RollBonus WeaponAttack 1 (attack half only; damage half not representable, per convention). "your hit point ma
    "Berserker Axe": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "1" } },
        { type: "Add", category: "HitPoints", value: { amount: "1", perLevel: "true" } },
        { type: "Add", category: "Advantage", value: { rollType: "WeaponAttack", mode: "disadvantage", condition: "on attack rolls with weapons other than this axe while attuned to (cursed by) it, unless no foe you can see or hear is within 60 feet" } },
    ],
    // "You gain a +1 bonus to attack and damage rolls made with this magic weapon" → RollBonus WeaponAttack 1, attack half only (damage half not representab
    "Dagger of Venom": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "1" } },
    ],
    // "you gain a +1 bonus to AC" -> flat AC; "you can understand and speak Abyssal" -> Languages Abyssal; clawed gauntlets give "a +1 bonus to attack rolls
    "Demon Armor": [
        { type: "Add", category: "ArmorClass", value: { bonus: "1" } },
        { type: "Add", category: "Languages", value: { name: "Abyssal" } },
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "1", condition: "with unarmed strikes (clawed gauntlets)" } },
        { type: "Add", category: "Advantage", value: { rollType: "WeaponAttack", mode: "disadvantage", condition: "on attack rolls against demons (cursed)" } },
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "disadvantage", condition: "against demons' spells and special abilities (cursed)" } },
    ],
    // "You gain a +1 bonus to attack and damage rolls made with this magic weapon" -> RollBonus WeaponAttack +1 (attack half only, matching Giant Slayer con
    "Dragon Slayer": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "1" } },
    ],
    // "You gain a +3 bonus to attack and damage rolls made with this magic weapon" -> RollBonus WeaponAttack +3 (attack half only, matching Defender convent
    "Dwarven Thrower": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "3" } },
    ],
    // "You gain a +1 bonus to AC while you wear this armor" -> flat AC +1; the second sentence ("considered proficient with this armor even if you lack prof
    "Elven Chain": [
        { type: "Add", category: "ArmorClass", value: { bonus: "1" } },
    ],
    // "You gain a +1 bonus to attack and damage rolls made with this magic weapon" -> RollBonus WeaponAttack +1 (attack half only). Giant's Bane: "your Stre
    "Hammer of Thunderbolts": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "1" } },
        { type: "Add", category: "Stats", value: { stat: "str", statValue: "4" } },
    ],
    // "As long as the helm has at least one ruby, you have resistance to fire damage" -> Resistances Fire (Resistances value only carries damageType, so the
    "Helm of Brilliance": [
        { type: "Add", category: "Resistances", value: { damageType: "Fire" } },
    ],
    // "You gain a +1 bonus to attack and damage rolls made with this magic weapon" — encode the attack half only (Weapon/Giant Slayer precedent). The "+3 wh
    "Mace of Smiting": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "1" } },
    ],
    // "You gain a +2 bonus to attack and damage rolls made with this magic weapon" — encode the attack half only (named-+N-weapon precedent); the damage hal
    "Nine Lives Stealer": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "2" } },
    ],
    // Per the conditional/self-activated advantage policy: "When you make a ranged attack roll with this weapon against your sworn enemy, you have advantage
    "Oathbow": [
        { type: "Add", category: "Advantage", value: { rollType: "WeaponAttack", mode: "advantage", condition: "on ranged attack rolls against your sworn enemy" } },
        { type: "Add", category: "Advantage", value: { rollType: "WeaponAttack", mode: "disadvantage", condition: "on attack rolls with all other weapons while your sworn enemy lives" } },
    ],
    // 'you have advantage on saving throws against any spell that targets only you (not in an area of effect)' — a clean conditional save advantage (same pa
    "Ring of Spell Turning": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against any spell that targets only you (not in an area of effect)" } },
    ],
    // Normal form 'functions as a magic mace that grants a +3 bonus to attack and damage rolls made with it' — encode the attack half only (damage half has 
    "Rod of Lordly Might": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "3", condition: "when wielded as a mace (its normal form)" } },
    ],
    // 'wielded as a magic quarterstaff that grants a +2 bonus to attack and damage rolls' plus 'While holding it, you gain a +2 bonus to Armor Class, saving
    "Staff of Power": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "2", condition: "when wielded as a quarterstaff" } },
        { type: "Add", category: "ArmorClass", value: { bonus: "2" } },
        { type: "Add", category: "RollBonus", value: { rollType: "SavingThrow", bonus: "2" } },
        { type: "Add", category: "RollBonus", value: { rollType: "SpellAttack", bonus: "2" } },
    ],
    // 'wielded as a magic quarterstaff that grants a +3 bonus to attack and damage rolls made with it' — encode the attack half only (damage half not repres
    "Staff of Striking": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "3", condition: "when wielded as a quarterstaff" } },
    ],
    // 'wielded as a magic quarterstaff that grants a +2 bonus to attack and damage rolls made with it' — encode the attack half only (damage half not repres
    "Staff of Thunder and Lightning": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "2", condition: "when wielded as a quarterstaff" } },
    ],
    // 'wielded as a magic quarterstaff that grants a +2 bonus to attack and damage rolls made with it. While holding it, you have a +2 bonus to spell attack
    "Staff of the Woodlands": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "2", condition: "when wielded as a quarterstaff" } },
        { type: "Add", category: "RollBonus", value: { rollType: "SpellAttack", bonus: "2" } },
    ],
    // 'You gain a +2 bonus to attack and damage rolls made with this weapon' — encode the attack half (damage half not representable). The flagged 'proficie
    "Sun Blade": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "2" } },
    ],
    // Grounding: "you gain a +2 bonus to spell attack rolls while you wear or hold it" -> flat d20 roll bonus = RollBonus SpellAttack +2, with the class gat
    "Talisman of Pure Good": [
        { type: "Add", category: "RollBonus", value: { rollType: "SpellAttack", bonus: "2", condition: "if you are a good cleric or paladin, while you wear or hold the talisman" } },
    ],
    // Grounding: "you gain a +2 bonus to spell attack rolls while you wear or hold it" -> flat d20 roll bonus = RollBonus SpellAttack +2, with the class gat
    "Talisman of Ultimate Evil": [
        { type: "Add", category: "RollBonus", value: { rollType: "SpellAttack", bonus: "2", condition: "if you are an evil cleric or paladin, while you wear or hold the talisman" } },
    ],
    // Grounding: "You gain a +3 bonus to attack and damage rolls made with this magic weapon" -> RollBonus WeaponAttack +3 (attack half only; the damage hal
    "Vorpal Sword": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "3" } },
    ],
};

/*
 * Coverage-gap sweep (July 2026) — documented SKIPS (verified; no fitting category or
 * deliberately out of scope per the decision rules):
 *  - Armor of Invulnerability: "You have resistance to nonmagical damage" — "nonmagical" is not one of the catalog's damage types (Resistances takes a concrete damageType only), and
 *  - Armor of Vulnerability: "resistance to one of the following damage types: bludgeoning, piercing, or slashing. The GM chooses the type" — the resisted type (and the cursed vul
 *  - Boots of Speed: "the boots double your walking speed" is a bonus-action, heel-click-activated multiplier (Speed only sets a value, not a doubling), and the "disadvant
 *  - Bracers of Archery: "proficiency with the longbow and shortbow" is a WEAPON proficiency (not one of the 18 canonical skills the Proficiencies category covers), and "a +2 
 *  - Broom of Flying: "It has a flying speed of 50 feet" is the OBJECT's speed while ridden, not the wearer's movement mode; Movement/Speed model the character's own moveme
 *  - Carpet of Flying: The carpet hovers and flies and you ride it; its flying speed varies by size (80/60/40/30 ft on the GM table). The object flies, not the wearer — no c
 *  - Cloak of Displacement: "causing any creature to have disadvantage on attack rolls against you" is disadvantage imposed on attackers, not a modifier to the wearer's own d20 r
 *  - Crystal Ball: "you can cast the scrying spell" is an active/charged use of the item (skipped per map convention, not a granted prepared spell), and the only sense —
 *  - Deck of Many Things: The deck's effects are random one-time card draws (e.g. Star: "Increase one of your ability scores by 2"), not persistent item properties granted by h
 *  - Figurine of Wondrous Power: Activated summon item that conjures a temporary creature on command; confers no permanent character-sheet stat. The only "immunity" text (goat of terr
 *  - Gem of Seeing: Truesight is temporary ("For the next 10 minutes... when you peer through the gem"), charge-activated, and not a permanent sense; charges recharge "1d
 *  - Horn of Blasting: Activated blast item (action to blow the horn). The "disadvantage" applies to the targets ("Creatures and objects made of glass or crystal have disadv
 *  - Horn of Valhalla: Activated summon (berserker spirits, 1 hour, 7-day cooldown). The "Proficiency with all simple/medium/martial weapons/armor" text is a REQUIREMENT to 
 *  - Instant Fortress: Conjures a tower. The "resistance to all other damage" (and the immunity to nonmagical-weapon damage) applies to the fortress's walls/door/roof, not t
 *  - Ioun Stone: Single item spanning many distinct variants (some set/raise ability scores, some grant PB, etc.), so no single command fits (already documented as a d
 *  - Iron Flask: The only advantage is the TARGET's: "If the target has been trapped by the flask before, it has advantage on the saving throw" — not the wielder's; an
 *  - Mithral Armor: "If the armor normally imposes disadvantage on Dexterity (Stealth) checks or has a Strength requirement, the mithral version doesn't" — this REMOVES a
 *  - Oil of Sharpness: Consumable: "For 1 hour, the coated item ... has a +3 bonus to attack and damage rolls." Temporary (1 hour) buff applied to a coated weapon/ammunition
 *  - Periapt of Health: "You are immune to contracting any disease" — disease immunity has no damage-type category (Immunities takes damage types only). Already documented as
 *  - Pipes of Haunting: The only immunity is on OTHER creatures: "A creature that succeeds on its saving throw is immune to the effect of these pipes for 24 hours" — not the 
 *  - Pipes of the Sewers: "You must be proficient with wind instruments to use these pipes" is a usage PREREQUISITE, not a granted proficiency (and wind instruments is not a ca
 *  - Potion of Climbing: Consumable: "When you drink this potion, you gain a climbing speed ... for 1 hour. During this time, you have advantage on Strength (Athletics) checks
 *  - Potion of Flying: Consumable: "you gain a flying speed equal to your walking speed for 1 hour and can hover." Temporary/consumable — already listed as a deliberate skip
 *  - Potion of Resistance: Consumable: "you gain resistance to one type of damage for 1 hour. The GM chooses the type or determines it randomly" — temporary AND the damage type 
 *  - Ring of Elemental Command: All benefits vary by which of four Elemental Planes the ring is linked to ('The GM chooses or randomly determines the linked plane'), the attack advan
 *  - Ring of Mind Shielding: 'immune to magic that allows other creatures to read your thoughts... know your creature type' is immunity to a magic category, not a damage-type immu
 *  - Robe of Scintillating Colors: The disadvantage is an activated, temporary effect: 'use an action and expend 1 charge to cause the garment to display... until the end of your next t
 *  - Rope of Climbing: 'While knotted, the rope... grants advantage on checks made to climb it' — the advantage applies only to climbing this rope and only after you command
 *  - Shield of Missile Attraction: 'resistance to damage from ranged weapon attacks' is keyed to an attack source, not a damage type — Resistances category is damage types only (same re
 *  - Trident of Fish Command: "movement type" trigger is a false positive: the "innate swimming speed" in "cast dominate beast ... on a beast that has an innate swimming speed" bel
 *  - Wand of Binding: Grounding: the Assisted Escape advantage requires "use your reaction to expend 1 charge and gain advantage" -> it is reaction + limited-charge activat
 *  - Wings of Flying: Grounding: "use an action to speak its command word ... for 1 hour ... When they disappear, you can't use them again for 1d12 hours" -> command-word-a
 */

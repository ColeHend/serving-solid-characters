import type { CommandSpecInput, MadMap } from "../spec.ts";

/**
 * Curated MADS commands for SRD 5.2 (2024) magic items. Keys are the exact item names (10_MagicItems.md) —
 * or, for entries the variant pass splits (mads/variants.ts), the exact SPLIT names ("Weapon, +1",
 * "Belt of Giant Strength (Hill)", "Armor of Resistance (Acid)", ...). Only permanent, literally-stated,
 * while-worn/held effects are encoded. Commands attach to the item's metadata.mads (mads/apply.ts).
 * Value fields are all strings.
 *
 * Deliberately SKIPPED (choice-dependent, situational, or no catalog category):
 *  - Damage halves of "+N to attack and damage rolls" items — damage is not a d20 roll or sheet stat;
 *    only the attack-roll RollBonus is encoded. Same for on-hit damage riders (Giant Slayer's 2d6,
 *    Holy Avenger's 2d10) and Defender's attack→AC reallocation.
 *  - Wand of the War Mage's "ignore Half Cover" rider; Scimitar of Speed's Bonus-Action attack
 *    (not an extra Attack-action attack, so Attacks would misstate it).
 *  - Dragon Scale Mail (resistance part) / Ring of Elemental Command / Helm of Brilliance — the
 *    resisted damage type is a gem/dragon/element CHOICE on a single item (unlike Armor/Ring of
 *    Resistance, whose GM-chosen table is split into concrete variants by mads/variants.ts).
 *  - Ring of Warmth (reduces Cold damage by 2d8, not full Resistance).
 *  - Potions (Giant Strength, Resistance, Healing, Climbing, ...) — consumable/temporary, no permanent effect.
 *  - Immunity to a spell's damage (Brooch of Shielding's Magic Missile immunity) — not a damage TYPE.
 *  - Winged Boots (charge-activated 1-hour flight) / Wings of Flying (Magic-action wings) — activated,
 *    temporary flight; Broom of Flying (the broom flies, not you); Boots of Speed (double speed — a
 *    multiplier, and click-heel activated) — not representable.
 *  - Eyes of Minute Seeing — Darkvision within 1 FOOT (a close-inspection gimmick; putting a 1-ft
 *    sense on the sheet would mislead) — only the Investigation advantage is encoded.
 */

// ---- tiny authoring helpers (all value fields are strings) ----
const add = (category: string, value: Record<string, string>): CommandSpecInput => ({ type: "Add", category, value });
const attackBonus = (bonus: string, condition?: string): CommandSpecInput =>
    add("RollBonus", { rollType: "WeaponAttack", bonus, ...(condition ? { condition } : {}) });
const spellAttackBonus = (bonus: string): CommandSpecInput => add("RollBonus", { rollType: "SpellAttack", bonus });
const saveBonus = (bonus: string): CommandSpecInput => add("RollBonus", { rollType: "SavingThrow", bonus });
const flatAC = (bonus: string): CommandSpecInput => add("ArmorClass", { bonus });
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
    // "+N bonus to Armor Class" (the Shield's normal +2 lives on the mundane item, not here).
    ...plusFamily("Armor", flatAC),
    ...plusFamily("Shield", flatAC),
    // "+N bonus to spell attack rolls" (ignore-Half-Cover rider → skip).
    ...plusFamily("Wand of the War Mage", spellAttackBonus),
    ...beltFamily(),
    ...resistanceFamily("Armor of Resistance"),
    ...resistanceFamily("Ring of Resistance"),

    // ---- Flat AC / save bonuses (while worn) ----
    "Ring of Protection": [flatAC("1"), saveBonus("1")],
    "Cloak of Protection": [flatAC("1"), saveBonus("1")],

    // ---- Named "+N" weapons (attack half only; riders noted in the header) ----
    "Scimitar of Speed": [attackBonus("2")],
    "Giant Slayer": [attackBonus("1")],
    "Defender": [attackBonus("3")],

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
    // Defense: "+1 bonus to Armor Class"; Preservation's charge-spend save rider → skip.
    "Scarab of Protection": [
        flatAC("1"),
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against spells" } },
    ],
    "Spellguard Shield": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against spells and other magical effects" } },
    ],
    // "+2 to attack and damage rolls made with it" as a Quarterstaff, "+2 bonus to spell attack rolls" held.
    "Staff of the Magi": [
        attackBonus("2", "when wielded as a Quarterstaff"),
        spellAttackBonus("2"),
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against spells" } },
    ],
    // "+3 bonus to attack rolls and damage rolls" — attack half (the 2d10 vs Fiends/Undead rider → skip).
    "Holy Avenger": [
        attackBonus("3"),
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against spells and other magical effects" } },
    ],
    // Dragon Scale Mail — "+1 bonus to AC"; the resistance is dragon-type-dependent (skipped); the Advantage is fixed.
    "Dragon Scale Mail": [
        flatAC("1"),
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against the breath weapons of Dragons" } },
    ],

    // Robe of the Archmagi — unarmored base AC 15 + Dex, plus Advantage on saves vs spells/magic.
    // (The +2 to spell save DC / spell attack bonus has no category.)
    "Robe of the Archmagi": [
        { type: "Add", category: "ArmorClass", value: { bonus: "15", stats: "dex" } },
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against spells and other magical effects" } },
    ],

    // ================================================================
    // Coverage-gap sweep (July 2026): entries below were proposed and
    // adversarially verified against the parsed SRD text.
    // ================================================================
    // 'You gain a +2 bonus to Armor Class against ranged attack rolls while you wield this Shield' — a conditional flat AC bonus (ArmorClass supports condit
    "Arrow-Catching Shield": [
        { type: "Add", category: "ArmorClass", value: { bonus: "2", condition: "against ranged attack rolls" } },
    ],
    // '+1 bonus to attack rolls and damage rolls' → attack half only (damage not representable); 'your Hit Point maximum increases by 1 for each level you h
    "Berserker Axe": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "1" } },
        { type: "Add", category: "HitPoints", value: { amount: "1", perLevel: "true" } },
        { type: "Add", category: "Advantage", value: { rollType: "WeaponAttack", mode: "disadvantage", condition: "on attack rolls with weapons other than this one (curse; applies while attuned)" } },
    ],
    // 'you gain a +2 bonus to Armor Class if you are wearing no armor and using no Shield' — a conditional flat AC bonus, encoded via ArmorClass with a free
    "Bracers of Defense": [
        { type: "Add", category: "ArmorClass", value: { bonus: "2", condition: "while wearing no armor and using no Shield" } },
    ],
    // 'You gain a +1 bonus to attack rolls and damage rolls made with this magic weapon' -> attack half only (damage has no command), matching Giant Slayer.
    "Dagger of Venom": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "1" } },
    ],
    // '+1 bonus to Armor Class' -> flat AC; 'you know Abyssal' -> Languages; '+1 bonus to the attack and damage rolls of your Unarmed Strikes' -> attack hal
    "Demon Armor": [
        { type: "Add", category: "ArmorClass", value: { bonus: "1" } },
        { type: "Add", category: "Languages", value: { name: "Abyssal" } },
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "1", condition: "with Unarmed Strikes" } },
        { type: "Add", category: "Advantage", value: { rollType: "WeaponAttack", mode: "disadvantage", condition: "attack rolls against demons (also applies to spell attacks per the text)" } },
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "disadvantage", condition: "against demons' spells and special abilities" } },
    ],
    // 'You gain a +1 bonus to attack rolls and damage rolls made with this magic weapon' -> attack half only, like Giant Slayer. The 'extra 3d6 damage ... i
    "Dragon Slayer": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "1" } },
    ],
    // 'While wearing this armor, you gain a +2 bonus to Armor Class' -> flat AC, like Armor +2. The Reaction to reduce forced movement by up to 10 feet is a
    "Dwarven Plate": [
        { type: "Add", category: "ArmorClass", value: { bonus: "2" } },
    ],
    // 'You gain a +3 bonus to attack rolls and damage rolls made with this magic weapon' -> attack half only, like Defender/Holy Avenger (+3). The extra 1d8
    "Dwarven Thrower": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "3" } },
    ],
    // 'You gain a +1 bonus to Armor Class while you wear this armor' -> flat AC. 'You are considered trained with this armor even if you lack training with 
    "Elven Chain": [
        { type: "Add", category: "ArmorClass", value: { bonus: "1" } },
    ],
    // 'While wearing this armor, you gain a +1 bonus to Armor Class' -> flat AC. The Bonus-Action illusory-appearance change is purely cosmetic/activated wi
    "Glamoured Studded Leather": [
        { type: "Add", category: "ArmorClass", value: { bonus: "1" } },
    ],
    // 'You gain a +1 bonus to attack rolls and damage rolls made with this magic weapon' -> attack half only. The 5-charge thunderclap throw (DC 17, recharg
    "Hammer of Thunderbolts": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "1" } },
    ],
    // 'Ruby Resistance. As long as the helm has at least one ruby, you have Resistance to Fire damage' -> fixed Fire resistance, like Frost Brand/Staff of F
    "Helm of Brilliance": [
        { type: "Add", category: "Resistances", value: { damageType: "Fire" } },
    ],
    // Literal flat d20 modifiers while on your person: '+1 bonus to attack rolls and damage rolls made with this magic weapon. While the weapon is on your p
    "Luck Blade": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "1" } },
        { type: "Add", category: "RollBonus", value: { rollType: "SavingThrow", bonus: "1" } },
    ],
    // 'You gain a +1 bonus to attack rolls and damage rolls made with this magic weapon.' Encode the base attack-roll half. The 'increases to +3 when you us
    "Mace of Smiting": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "1" } },
    ],
    // 'You gain a +2 bonus to attack rolls and damage rolls made with this magic weapon.' Encode the attack-roll half; the damage half has no command, and t
    "Nine Lives Stealer": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "2" } },
    ],
    // Conditional/self-activated Advantage and Disadvantage are encoded with trigger text per policy: 'When you make a ranged attack roll with this weapon a
    "Oathbow": [
        { type: "Add", category: "Advantage", value: { rollType: "WeaponAttack", mode: "advantage", condition: "on ranged attack rolls against your sworn enemy" } },
        { type: "Add", category: "Advantage", value: { rollType: "WeaponAttack", mode: "disadvantage", condition: "on attack rolls with all other weapons while your sworn enemy lives" } },
    ],
    // Elemental Bane is fixed on every variant: 'you have Advantage on attack rolls against Elementals' — encode as Advantage (weapon + spell) with that con
    "Ring of Elemental Command": [
        { type: "Add", category: "Advantage", value: { rollType: "WeaponAttack", mode: "advantage", condition: "attack rolls against Elementals" } },
        { type: "Add", category: "Advantage", value: { rollType: "SpellAttack", mode: "advantage", condition: "attack rolls against Elementals" } },
    ],
    // Permanent while-worn flat bonus: 'You gain a +1 bonus to saving throws while you wear it' -> RollBonus SavingThrow +1 (matches the saveBonus conventio
    "Robe of Stars": [
        { type: "Add", category: "RollBonus", value: { rollType: "SavingThrow", bonus: "1" } },
    ],
    // Default form is a permanent magic Mace that 'grants a +3 bonus to attack rolls and damage rolls made with it' -> RollBonus WeaponAttack +3 (attack hal
    "Rod of Lordly Might": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "3" } },
    ],
    // Permanent while-held bonuses: 'Quarterstaff that grants a +2 bonus to attack rolls and damage rolls' -> RollBonus WeaponAttack +2 (attack half only; d
    "Staff of Power": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "2", condition: "when wielded as a Quarterstaff" } },
        { type: "Add", category: "ArmorClass", value: { bonus: "2" } },
        { type: "Add", category: "RollBonus", value: { rollType: "SavingThrow", bonus: "2" } },
        { type: "Add", category: "RollBonus", value: { rollType: "SpellAttack", bonus: "2" } },
    ],
    // Permanent while-held weapon bonus: 'Quarterstaff that grants a +3 bonus to attack rolls and damage rolls made with it' -> RollBonus WeaponAttack +3 (a
    "Staff of Striking": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "3", condition: "when wielded as a Quarterstaff" } },
    ],
    // "grants a +2 bonus to attack rolls and damage rolls made with it. While holding it, you have a +2 bonus to spell attack rolls." Attack half only (dama
    "Staff of the Woodlands": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "2", condition: "when wielded as a Quarterstaff" } },
        { type: "Add", category: "RollBonus", value: { rollType: "SpellAttack", bonus: "2" } },
    ],
    // "wielded as a magic Quarterstaff that grants a +2 bonus to attack rolls and damage rolls made with it." Attack half only (damage half not representabl
    "Staff of Thunder and Lightning": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "2", condition: "when wielded as a Quarterstaff" } },
    ],
    // "While this polished agate is on your person, you gain a +1 bonus to ability checks and saving throws." Both are flat d20 modifiers → RollBonus Abilit
    "Stone of Good Luck (Luckstone)": [
        { type: "Add", category: "RollBonus", value: { rollType: "AbilityCheck", bonus: "1" } },
        { type: "Add", category: "RollBonus", value: { rollType: "SavingThrow", bonus: "1" } },
    ],
    // "You gain a +2 bonus to attack rolls and damage rolls made with this weapon" → attack half only (matches named +N weapon convention). The flagged prof
    "Sun Blade": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "2" } },
    ],
    // "You gain a +2 bonus to spell attack rolls while you wear or hold it." → SpellAttack RollBonus. The flagged Disadvantage (Pure Rebuke: a Fiend/Undead 
    "Talisman of Pure Good": [
        { type: "Add", category: "RollBonus", value: { rollType: "SpellAttack", bonus: "2" } },
    ],
    // "While holding or wearing this talisman, you have Advantage on any Intelligence (Arcana) check you make to control a Sphere of Annihilation." Fixed co
    "Talisman of the Sphere": [
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", stat: "int", condition: "Intelligence (Arcana) checks made to control a Sphere of Annihilation" } },
    ],
    // "You gain a +2 bonus to spell attack rolls while you wear or hold it." → SpellAttack RollBonus (mirrors Talisman of Pure Good). The flagged Disadvanta
    "Talisman of Ultimate Evil": [
        { type: "Add", category: "RollBonus", value: { rollType: "SpellAttack", bonus: "2" } },
    ],
    // "You gain a +3 bonus to attack rolls and damage rolls made with this magic weapon" → attack half only (matches Holy Avenger/Defender). The flagged "we
    "Vorpal Sword": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "3" } },
    ],
};

/*
 * Coverage-gap sweep (July 2026) — documented SKIPS (verified; no fitting category or
 * deliberately out of scope per the decision rules):
 *  - Apparatus of the Crab: The Poison/Psychic immunity is a stat of the Apparatus OBJECT's own block, not a character benefit: 'The Apparatus of the Crab is a Large object with 
 *  - Armor of Vulnerability: 'you have Resistance to one of the following damage types: Bludgeoning, Piercing, or Slashing. The GM chooses the type' — a GM CHOICE of type on a sin
 *  - Boots of Speed: Activated ('Bonus Action to click the boots' heels together'), temporary (ceases after 10 minutes until a Long Rest), and the double-Speed is a multip
 *  - Bracers of Archery: 'you have proficiency with the Longbow and Shortbow' is WEAPON proficiency, and the Proficiencies category covers skills only (no weapon-proficiency c
 *  - Broom of Flying: The header already documents this: the broom flies, not you. It's a ridden object with its own 'Fly Speed of 50 feet', engaged by a Magic action; not 
 *  - Candle of Invocation: Activated/consumable (Magic action to light; burns 4 hours then 'the candle is destroyed'). 'While you are within that light, you have Advantage on D2
 *  - Carpet of Flying: Like Broom of Flying: a ridden object with its own size-dependent Fly Speed ('You can make this carpet hover and fly by taking a Magic action'), not t
 *  - Cloak of Displacement: The effect imposes Disadvantage on OTHER creatures' 'attack rolls against you' — a defensive effect on the attacker's roll. The Advantage/RollBonus ro
 *  - Crystal Ball of True Seeing: 'you have Truesight with a range of 120 feet centered on the spell's sensor' — the Truesight is the Scrying sensor's sight while you cast Scrying with
 *  - Figurine of Wondrous Power: The item summons a temporary living creature (per-figurine duration, multi-day per-item recharge); it grants the wearer no permanent character-change.
 *  - Gem of Seeing: 'For the next 10 minutes, you have Truesight out to 120 feet when you peer through the gem' is activated (Magic action, expend 1 charge) and temporary
 *  - Horn of Valhalla: The Magic-action horn summons temporary Berserker warrior spirits (1 hour, once per 7 days) and grants the wearer no permanent effect. The 'Immunity t
 *  - Instant Fortress: The only Resistance/Immunity belongs to the summoned tower structure ('The roof, the door, and the walls each have AC 20; HP 100; Immunity to Bludgeon
 *  - Ioun Stone: A single generic entry covering many stone types with mutually exclusive effects (Awareness: 'Advantage on Initiative rolls and Wisdom (Perception) ch
 *  - Iron Flask: The only Advantage is granted to the TARGETED creature's save, not the wielder: 'If the target has been trapped by the flask before, it has Advantage 
 *  - Mirror of Life Trapping: The Immunity/Vulnerability belongs to the mirror object, not the character: 'it has AC 11, HP 10, Immunity to Poison and Psychic damage, and Vulnerabi
 *  - Mithral Armor: It removes an existing drawback rather than granting one: 'If the armor normally imposes Disadvantage on Dexterity (Stealth) checks or has a Strength 
 *  - Mysterious Deck: All effects come from random one-time card draws that are temporary or choice-based: Jester 'Advantage on D20 Tests for the next 72 hours', Fool 'Disa
 *  - Pipes of Haunting: The Immunity applies to creatures that saved against the effect, not the wielder, and is not a damage type: 'A creature that succeeds on its save is i
 *  - Potion of Climbing: Consumable/temporary: 'you gain a Climb Speed equal to your Speed for 1 hour. During this time, you have Advantage on Strength (Athletics) checks to c
 *  - Potion of Flying: Consumable/temporary: 'you gain a Fly Speed equal to your Speed for 1 hour.' Potions are deliberately skipped (header); Movement is a while-worn perma
 *  - Potion of Resistance: Consumable + temporary + GM-chosen type: 'you have Resistance to one type of damage for 1 hour.' No fixed damage type and no permanent effect; header 
 *  - Ring of Mind Shielding: 'you are immune to magic that allows other creatures to read your thoughts...' is immunity to a category of magic/effects, not a damage type. Immuniti
 *  - Robe of Scintillating Colors: Charge-activated and temporary: Magic action, expend 1 charge, effect lasts 'until the end of your next turn.' The 'creatures... have Disadvantage on 
 *  - Rope of Climbing: 'The rope has AC 20, HP 20, and Immunity to Poison and Psychic damage' is the rope OBJECT's own durability, not a benefit conferred to the wearer. The
 *  - Rope of Entanglement: 'The rope has AC 20, HP 20, and Immunity to Poison and Psychic damage' is the rope OBJECT's own immunity, not conferred to the character. The rest is 
 *  - Shield of Missile Attraction: 'Resistance to damage from attacks made with Ranged weapons' is resistance to a damage SOURCE, not a damage type. Resistances requires a damageType fr
 *  - Trident of Fish Command: The only "Swim Speed" reference is a targeting restriction on the charge-cast spell ("cast Dominate Beast ... on a Beast that has a Swim Speed"), not 
 *  - Winged Boots: "expend 1 charge, gaining a Fly Speed of 30 feet for 1 hour" — charge-activated, temporary flight, not a permanent while-worn movement mode (matches t
 *  - Wings of Flying: "take a Magic action to turn the cloak into a pair of wings ... The wings ... give you a Fly Speed of 60 feet" for 1 hour — activated, temporary fligh
 */

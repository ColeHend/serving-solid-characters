import type { MadMap } from "../spec.ts";

/**
 * Curated MADS commands for the SRD 5.1 (2014) CLASS features. Keys per mads/spec.ts:
 * "<Class>/<Feature name>" where the feature name matches the progression-table Features
 * column verbatim (e.g. "Brutal Critical (1 die)", "Extra Attack (2)", "Channel Divinity (1/rest)").
 *
 * Only effects the SRD text LITERALLY states are encoded. Situational effects (advantage while
 * raging, "against your favored enemies"), damage riders (Sneak Attack, Divine Smite, Brutal
 * Critical), temp HP, rerolls (Lucky-like), healing, resource pools, player-choice picks
 * (Fighting Style, Metamagic, Expertise, Eldritch Invocations, Mystic Arcanum) and cap-raising
 * capstones are intentionally skipped — see the per-class // skipped notes.
 *
 * Limited-use (Uses) commands carry the BASE amount; level-scaling of uses stays in classSpecific.
 * Ability Score Improvement is modeled as a single +2 to a chosen ability — the SRD "+2 to one OR
 * +1/+1 to two" split isn't representable, so every ASI is an APPROXIMATION (+2, player picks one).
 */
export const map: MadMap = {
    // ----- Barbarian -----
    "Barbarian/Rage": [
        // base 2 rages/long rest; scaling (3/4/5/unlimited) stays in classSpecific "Rages"
        { type: "Add", category: "Uses", value: { amount: "2", recharge: "Long Rest" } },
    ],
    "Barbarian/Unarmored Defense": [
        { type: "Add", category: "ArmorClass", value: { bonus: "10", stats: "dex,con" } },
    ],
    "Barbarian/Danger Sense": [
        // permanent, unconditional-while-able: advantage on Dex saves vs effects you can see
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", stat: "dex", condition: "against effects you can see" } },
    ],
    "Barbarian/Ability Score Improvement": [
        // approximation: SRD is +2 to one or +1/+1 to two; the split isn't representable
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "2" } },
    ],
    "Barbarian/Extra Attack": [
        { type: "Add", category: "Attacks", value: { amount: "1" } },
    ],
    "Barbarian/Fast Movement": [
        { type: "Add", category: "Speed", value: { speed: "10" } },
    ],
    "Barbarian/Feral Instinct": [
        { type: "Add", category: "Advantage", value: { rollType: "Initiative", mode: "advantage" } },
    ],
    "Barbarian/Primal Champion": [
        // +4 STR / +4 CON, ability caps raised to 24 (the sheet ignores caps) — two fixed increases
        { type: "Add", category: "Stats", value: { stat: "str", statValue: "4" } },
        { type: "Add", category: "Stats", value: { stat: "con", statValue: "4" } },
    ],
    // skipped: Reckless Attack (advantage only while attacking recklessly — situational),
    //   Brutal Critical (crit damage die — damage rider), Relentless (Relentless Rage: CON save
    //   while at 0 HP — situational), Persistent Rage (rage doesn't end early — no category),
    //   Indomitable Might (use STR score for STR checks — DM adjudication), Primal Path (subclass).

    // ----- Bard -----
    "Bard/Bardic Inspiration (d6)": [
        // approximation: uses = Charisma modifier (min 1); die/recharge upgrades are separate features
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Long Rest" } },
    ],
    "Bard/Ability Score Improvement": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "2" } },
    ],
    // skipped: Jack of All Trades (half PB to ANY ability check not already proficient — applies to
    //   raw ability checks, not an enumerable skill set), Song of Rest (short-rest healing),
    //   Expertise (player chooses two skills), Font of Inspiration (changes Bardic Inspiration
    //   recharge), Countercharm (advantage only while performing — situational), Magical Secrets
    //   (player-choice spells), Superior Inspiration (situational), die upgrades (d8/d10/d12).

    // ----- Cleric -----
    "Cleric/Ability Score Improvement": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "2" } },
    ],
    // apply.ts splits map keys on the FIRST "/" only, so the "/" inside the feature name is fine.
    "Cleric/Channel Divinity (1/rest)": [
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Short Rest" } },
    ],
    // skipped: Channel Divinity (2/rest)/(3/rest) (scaling of the use count), Destroy Undead
    //   (enhances Turn Undead — situational), Divine Intervention (+ improvement) (DM adjudication),
    //   Divine Domain (subclass), Spellcasting.

    // ----- Druid -----
    "Druid/Druidic": [
        { type: "Add", category: "Languages", value: { name: "Druidic" } },
    ],
    "Druid/Wild Shape": [
        { type: "Add", category: "Uses", value: { amount: "2", recharge: "Short Rest" } },
    ],
    "Druid/Ability Score Improvement": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "2" } },
    ],
    // skipped: Wild Shape Improvement (raises beast CR/limits), Timeless Body (aging), Beast Spells
    //   (cast while shaped), Archdruid (unlimited Wild Shape — cap), Druid Circle (subclass).

    // ----- Fighter -----
    "Fighter/Second Wind": [
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Short Rest" } },
    ],
    "Fighter/Action Surge (one use)": [
        // base 1 use/short rest; "Action Surge (two uses)" at L17 is a separate scaling feature
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Short Rest" } },
    ],
    "Fighter/Ability Score Improvement": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "2" } },
    ],
    "Fighter/Extra Attack": [
        { type: "Add", category: "Attacks", value: { amount: "1" } },
    ],
    "Fighter/Indomitable (one use)": [
        // base 1 use/long rest; "(two uses)"/"(three uses)" are separate scaling features
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Long Rest" } },
    ],
    // distinctly-named Extra Attack rows stack cumulatively (each grants +1 attack): 2 at L5,
    // 3 at L11, 4 at L20 — so amount "1" on each of the three feature instances.
    "Fighter/Extra Attack (2)": [
        { type: "Add", category: "Attacks", value: { amount: "1" } },
    ],
    "Fighter/Extra Attack (3)": [
        { type: "Add", category: "Attacks", value: { amount: "1" } },
    ],
    // skipped: Fighting Style (player-choice option), Action Surge (two uses) / Indomitable (two/
    //   three uses) (use-count scaling), Martial Archetype (subclass).

    // ----- Monk -----
    "Monk/Unarmored Defense": [
        { type: "Add", category: "ArmorClass", value: { bonus: "10", stats: "dex,wis" } },
    ],
    "Monk/Unarmored Movement": [
        // base +10 ft; scaling stays in classSpecific "Unarmored Movement"
        { type: "Add", category: "Speed", value: { speed: "10" } },
    ],
    "Monk/Ability Score Improvement": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "2" } },
    ],
    "Monk/Extra Attack": [
        { type: "Add", category: "Attacks", value: { amount: "1" } },
    ],
    "Monk/Purity of Body": [
        // "immune to disease and poison" — poison damage-type immunity (disease has no category)
        { type: "Add", category: "Immunities", value: { damageType: "Poison" } },
    ],
    "Monk/Diamond Soul": [
        // "proficiency in all saving throws" → all six
        { type: "Add", category: "SavingThrows", value: { stat: "str" } },
        { type: "Add", category: "SavingThrows", value: { stat: "dex" } },
        { type: "Add", category: "SavingThrows", value: { stat: "con" } },
        { type: "Add", category: "SavingThrows", value: { stat: "int" } },
        { type: "Add", category: "SavingThrows", value: { stat: "wis" } },
        { type: "Add", category: "SavingThrows", value: { stat: "cha" } },
    ],
    // skipped: Martial Arts (unarmed die/weapon rules), Ki (points resource), Deflect Missiles,
    //   Slow Fall, Stunning Strike, Ki-Empowered Strikes (magical strikes — no category), Evasion,
    //   Stillness of Mind, Unarmored Movement improvement (scaling), Tongue of the Sun and Moon
    //   (understand all languages — not a specific language), Timeless Body, Empty Body (temporary
    //   invisibility/resistance), Perfect Self (ki regen), Monastic Tradition (subclass).

    // ----- Paladin -----
    "Paladin/Divine Sense": [
        // approximation: uses = 1 + Charisma modifier
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Long Rest" } },
    ],
    "Paladin/Ability Score Improvement": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "2" } },
    ],
    "Paladin/Extra Attack": [
        { type: "Add", category: "Attacks", value: { amount: "1" } },
    ],
    "Paladin/Cleansing Touch": [
        // approximation: uses = Charisma modifier (min 1)
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Long Rest" } },
    ],
    // skipped: Lay on Hands (HP pool, not a use count), Divine Smite / Improved Divine Smite
    //   (radiant damage riders), Divine Health (immune to disease — no category), Aura of Protection
    //   (numeric save bonus — no category), Aura of Courage (can't be frightened — condition, no
    //   category), Aura improvements (range scaling), Fighting Style (player-choice), Spellcasting,
    //   Sacred Oath (subclass).

    // ----- Ranger -----
    "Ranger/Ability Score Improvement": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "2" } },
    ],
    "Ranger/Extra Attack": [
        { type: "Add", category: "Attacks", value: { amount: "1" } },
    ],
    // skipped: Favored Enemy (advantage only when tracking/recalling that enemy + player-choice
    //   language — situational), Natural Explorer (doubled PB only in favored terrain), Fighting
    //   Style (player-choice), Primeval Awareness, Land's Stride (advantage vs impeding plants —
    //   conditional), Hide in Plain Sight (conditional Stealth bonus), Vanish, Feral Senses, Foe
    //   Slayer (situational), Ranger Archetype (subclass).

    // ----- Rogue -----
    "Rogue/Thieves' Cant": [
        { type: "Add", category: "Languages", value: { name: "Thieves' Cant" } },
    ],
    "Rogue/Ability Score Improvement": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "2" } },
    ],
    "Rogue/Slippery Mind": [
        { type: "Add", category: "SavingThrows", value: { stat: "wis" } },
    ],
    // skipped: Expertise (player chooses two proficiencies), Sneak Attack (damage rider), Cunning
    //   Action, Uncanny Dodge, Evasion, Reliable Talent, Blindsense, Elusive (denies enemies
    //   advantage — no category), Stroke of Luck (miss→hit / treat check as 20 — DM adjudication),
    //   Roguish Archetype (subclass).

    // ----- Sorcerer -----
    "Sorcerer/Ability Score Improvement": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "2" } },
    ],
    // skipped: Font of Magic (sorcery-point resource), Metamagic (player-choice options),
    //   Sorcerous Restoration (resource regen), Sorcerous Origin (subclass), Spellcasting.

    // ----- Warlock -----
    "Warlock/Ability Score Improvement": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "2" } },
    ],
    // skipped: Pact Magic (spell slots), Eldritch Invocations (player-choice picks), Pact Boon
    //   (player-choice), Mystic Arcanum (player-choice spell), Eldritch Master (slot recovery),
    //   Otherworldly Patron (subclass).

    // ----- Wizard -----
    "Wizard/Ability Score Improvement": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "2" } },
    ],
    // skipped: Arcane Recovery (slot recovery), Spell Mastery / Signature Spell (player-choice
    //   spells), Arcane Tradition (subclass), Spellcasting.
};

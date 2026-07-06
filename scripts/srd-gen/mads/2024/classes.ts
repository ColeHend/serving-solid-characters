import type { CommandSpecInput, MadMap } from "../spec.ts";

/**
 * Curated MADS commands for the SRD 5.2 (2024) CLASSES.
 * Source of truth: Docs/dndsrd5.2_markdown-main/src/03_Classes/01_Barbarian.md … 12_Wizard.md
 *
 * Keys are "<Class>/<Feature>" where <Feature> is the EXACT wording of the class's Features-table
 * "Class Features" column (that is the name the 2024 parser emits — parentheticals kept, e.g.
 * "Action Surge (one use)", "Mystic Arcanum (level 6 spell)"). Duplicate feature names (e.g. the
 * four "Ability Score Improvement" rows) all receive the commands — the map key is level-agnostic.
 *
 * Conventions used here:
 *  - Uses.recharge = the rest at which ALL expended uses are regained. Per the task's Rage example,
 *    Rage regains one use on a Short Rest but ALL on a Long Rest → recharge "Long Rest". Features that
 *    fully reset on a Short Rest (Action Surge, Focus Points, Stroke of Luck) use "Short Rest".
 *  - Uses.amount is the count granted at THIS feature; per-level scaling stays in the class table.
 *    Where the count is an ability modifier ("equal to your Charisma modifier, minimum of once") we
 *    approximate with the minimum "1" and flag it — the modifier isn't representable.
 *  - Ability Score Improvement (the 2024 feat) → choice-form +2 to one ability (approximation: the
 *    +1/+1 split isn't representable; the sheet lets the player pick which ability).
 *  - Extra-attack chains: each distinctly named feature adds the DELTA so the cumulative total is
 *    right (base 1 attack + Extra Attack +1 = 2; + Two Extra Attacks +1 = 3; + Three Extra Attacks +1 = 4).
 *
 * SKIPPED (no fitting category / player-or-DM choice / situational — see inline comments):
 *  Weapon Mastery (choice of weapons), Fighting Style & Metamagic & Eldritch Invocations (choice of
 *  option/feat), Epic Boon (choice of feat), condition immunities (Immunities is damage-type only),
 *  flat save bonuses, temp-HP / damage riders / rerolls, "while raging"-style situational effects,
 *  and choice-dependent spell/resistance grants.
 */

// ---- tiny authoring helpers (all value fields are strings) ----
const add = (category: string, value: Record<string, string>, target?: string): CommandSpecInput =>
    ({ type: "Add", category, value, ...(target ? { target } : {}) });

const uses = (amount: string, recharge: string): CommandSpecInput => add("Uses", { amount, recharge });
const spell = (name: string): CommandSpecInput => add("Spells", {}, name);
const extraAttack = (): CommandSpecInput => add("Attacks", { amount: "1" });
const ac = (bonus: string, stats: string): CommandSpecInput => add("ArmorClass", { bonus, stats });
const speed = (feet: string): CommandSpecInput => add("Speed", { speed: feet });
const raiseStat = (stat: string, statValue: string): CommandSpecInput => add("Stats", { stat, statValue });
const savingThrow = (stat: string): CommandSpecInput => add("SavingThrows", { stat });
const language = (name: string): CommandSpecInput => add("Languages", { name });
const adv = (rollType: string, extra: Record<string, string> = {}): CommandSpecInput =>
    add("Advantage", { rollType, mode: "advantage", ...extra });
// 2024 ASI feat: +2 to one ability of the player's choice (the +1/+1 option isn't representable).
const asi = (): CommandSpecInput => add("Stats", { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "2" });

export const map: MadMap = {
    // ============================================================ Barbarian
    "Barbarian/Rage": [uses("2", "Long Rest")], // B/P/S resistance is only "while raging" → situational, skip
    "Barbarian/Unarmored Defense": [ac("10", "dex,con")],
    "Barbarian/Danger Sense": [adv("SavingThrow", { stat: "dex", condition: "unless Incapacitated" })],
    "Barbarian/Ability Score Improvement": [asi()],
    "Barbarian/Extra Attack": [extraAttack()],
    "Barbarian/Fast Movement": [speed("10")],
    "Barbarian/Feral Instinct": [adv("Initiative")],
    // Primal Champion: Strength & Constitution increase by 4 (max 25 not representable).
    "Barbarian/Primal Champion": [raiseStat("str", "4"), raiseStat("con", "4")],
    // skip: Weapon Mastery, Reckless Attack (situational adv), Primal Knowledge (skill choice),
    //       Brutal Strike / Improved Brutal Strike (damage rider), Relentless Rage & Persistent Rage
    //       (situational), Indomitable Might (score-as-total), Instinctive Pounce, Epic Boon.

    // ============================================================ Bard
    "Bard/Bardic Inspiration": [uses("1", "Long Rest")], // uses = Charisma modifier (min 1) — approximated as 1
    "Bard/Ability Score Improvement": [asi()],
    "Bard/Words of Creation": [spell("Power Word Heal"), spell("Power Word Kill")],
    // skip: Expertise (skill choice), Jack of All Trades, Font of Inspiration (recharge change),
    //       Countercharm, Magical Secrets, Superior Inspiration, Epic Boon.

    // ============================================================ Cleric
    "Cleric/Channel Divinity": [uses("2", "Long Rest")], // one use back on a Short Rest, all on a Long Rest
    "Cleric/Divine Intervention": [uses("1", "Long Rest")],
    "Cleric/Ability Score Improvement": [asi()],
    // skip: Divine Order (choice), Sear Undead (rider), Blessed Strikes / Improved Blessed Strikes
    //       (choice + rider), Greater Divine Intervention, Epic Boon.

    // ============================================================ Druid
    // Druidic: grants the Druidic language and always-prepared Speak with Animals.
    "Druid/Druidic": [language("Druidic"), spell("Speak with Animals")],
    "Druid/Wild Shape": [uses("2", "Long Rest")], // one use back on a Short Rest, all on a Long Rest
    "Druid/Ability Score Improvement": [asi()],
    // skip: Primal Order (choice), Wild Companion, Wild Resurgence (slot/shape conversion),
    //       Elemental Fury / Improved Elemental Fury (choice + rider), Beast Spells, Archdruid, Epic Boon.

    // ============================================================ Fighter
    "Fighter/Second Wind": [uses("2", "Long Rest")],
    "Fighter/Action Surge (one use)": [uses("1", "Short Rest")],
    "Fighter/Extra Attack": [extraAttack()], // total 2
    "Fighter/Indomitable (one use)": [uses("1", "Long Rest")],
    "Fighter/Two Extra Attacks": [extraAttack()], // +1 over Extra Attack → total 3
    "Fighter/Three Extra Attacks": [extraAttack()], // +1 over Two Extra Attacks → total 4
    "Fighter/Ability Score Improvement": [asi()],
    // skip: Fighting Style (feat choice), Weapon Mastery, Tactical Mind/Shift/Master, Studied Attacks,
    //       "Action Surge (two uses)" & "Indomitable (two/three uses)" (extra uses are scaling of the
    //       same resource — the base grant already carries the Uses command), Epic Boon.

    // ============================================================ Monk
    "Monk/Unarmored Defense": [ac("10", "dex,wis")],
    "Monk/Monk's Focus": [uses("2", "Short Rest")], // Focus Points: all regained on a Short or Long Rest
    "Monk/Unarmored Movement": [speed("10")], // +10 ft base; +15/+20/+25/+30 scaling stays in the table
    "Monk/Uncanny Metabolism": [uses("1", "Long Rest")],
    "Monk/Extra Attack": [extraAttack()],
    // Disciplined Survivor: proficiency in ALL saving throws.
    "Monk/Disciplined Survivor": [
        savingThrow("str"), savingThrow("dex"), savingThrow("con"),
        savingThrow("int"), savingThrow("wis"), savingThrow("cha"),
    ],
    // Body and Mind: Dexterity & Wisdom increase by 4 (max 25 not representable).
    "Monk/Body and Mind": [raiseStat("dex", "4"), raiseStat("wis", "4")],
    "Monk/Ability Score Improvement": [asi()],
    // skip: Martial Arts (unarmed-strike die), Slow Fall, Stunning Strike (rider), Empowered Strikes,
    //       Evasion, Acrobatic Movement, Heightened Focus, Self-Restoration, Deflect Attacks/Energy,
    //       Perfect Focus, Superior Defense (situational resistance), Epic Boon.

    // ============================================================ Paladin
    "Paladin/Paladin's Smite": [spell("Divine Smite"), uses("1", "Long Rest")], // free cast once per Long Rest
    "Paladin/Channel Divinity": [uses("2", "Long Rest")],
    "Paladin/Extra Attack": [extraAttack()],
    "Paladin/Faithful Steed": [spell("Find Steed"), uses("1", "Long Rest")], // free cast once per Long Rest
    "Paladin/Ability Score Improvement": [asi()],
    // skip: Lay On Hands (HP pool, no category), Weapon Mastery, Fighting Style (choice),
    //       Aura of Protection (flat +CHA to saves, not proficiency/advantage), Abjure Foes (channel),
    //       Aura of Courage (Frightened-immunity is a condition, not a damage type), Radiant Strikes
    //       (rider), Restoring Touch, Aura Expansion, Epic Boon.

    // ============================================================ Ranger
    "Ranger/Favored Enemy": [spell("Hunter's Mark"), uses("2", "Long Rest")], // free Hunter's Mark casts
    "Ranger/Extra Attack": [extraAttack()],
    "Ranger/Roving": [speed("10")],
    "Ranger/Nature's Veil": [uses("1", "Long Rest")], // uses = Wisdom modifier (min 1) — approximated as 1
    "Ranger/Ability Score Improvement": [asi()],
    // skip: Weapon Mastery, Deft Explorer (expertise/language choice), Fighting Style (choice),
    //       Expertise (skill choice), Tireless (temp HP), Relentless Hunter, Precise Hunter (situational
    //       adv), Feral Senses (blindsight), Foe Slayer, Epic Boon.

    // ============================================================ Rogue
    "Rogue/Thieves' Cant": [language("Thieves' Cant")], // the "one other language of your choice" → skip
    "Rogue/Slippery Mind": [savingThrow("wis"), savingThrow("cha")],
    "Rogue/Stroke of Luck": [uses("1", "Short Rest")],
    "Rogue/Ability Score Improvement": [asi()],
    // skip: Expertise (skill choice), Sneak Attack (rider), Weapon Mastery, Cunning Action, Steady Aim
    //       (situational adv), Cunning Strike / Improved Cunning Strike / Devious Strikes (riders),
    //       Uncanny Dodge, Evasion, Reliable Talent, Elusive, Epic Boon.

    // ============================================================ Sorcerer
    "Sorcerer/Innate Sorcery": [uses("2", "Long Rest")],
    "Sorcerer/Font of Magic": [uses("2", "Long Rest")], // Sorcery Points, 2 at level 2; scaling in the table
    "Sorcerer/Sorcerous Restoration": [uses("1", "Long Rest")],
    "Sorcerer/Ability Score Improvement": [asi()],
    // skip: Metamagic (option choice), Sorcery Incarnate, Arcane Apotheosis, Epic Boon.

    // ============================================================ Warlock
    "Warlock/Magical Cunning": [uses("1", "Long Rest")],
    "Warlock/Contact Patron": [spell("Contact Other Plane"), uses("1", "Long Rest")],
    "Warlock/Mystic Arcanum (level 6 spell)": [uses("1", "Long Rest")], // the chosen arcanum spell is a choice → skip
    "Warlock/Ability Score Improvement": [asi()],
    // skip: Eldritch Invocations (choice), Pact Magic, Mystic Arcanum (level 7/8/9 spell) (extra uses =
    //       scaling of the same resource), Eldritch Master, Epic Boon.

    // ============================================================ Wizard
    "Wizard/Arcane Recovery": [uses("1", "Long Rest")],
    "Wizard/Ability Score Improvement": [asi()],
    // skip: Ritual Adept, Scholar (expertise choice), Memorize Spell, Spell Mastery / Signature Spells
    //       (chosen spells), Epic Boon.
};

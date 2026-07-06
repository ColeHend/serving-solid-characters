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
// a movement mode; omit feet when the text says "equal to your Speed"
const movement = (movementType: string, feet?: string): CommandSpecInput =>
    add("Movement", { movementType, ...(feet ? { speed: feet } : {}) });
const senses = (sense: string, range: string): CommandSpecInput => add("Senses", { sense, range });
const raiseStat = (stat: string, statValue: string): CommandSpecInput => add("Stats", { stat, statValue });
const savingThrow = (stat: string): CommandSpecInput => add("SavingThrows", { stat });
const language = (name: string): CommandSpecInput => add("Languages", { name });
const adv = (rollType: string, extra: Record<string, string> = {}): CommandSpecInput =>
    add("Advantage", { rollType, mode: "advantage", ...extra });
// an activated ability: a new action/bonusAction/reaction on the sheet; source (defaults to the
// action's name) = the granting feature's EXACT name, linking to its featureUses counter;
// description = a short cost/condition qualifier when the grant isn't unconditional
const action = (name: string, actionType: string, source?: string, description?: string): CommandSpecInput =>
    add("Actions", { name, actionType, source: source ?? name, ...(description ? { description } : {}) });
// 2024 ASI feat: +2 to one ability of the player's choice (the +1/+1 option isn't representable).
const asi = (): CommandSpecInput => add("Stats", { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "2" });

export const map: MadMap = {
    // ============================================================ Barbarian
    "Barbarian/Rage": [uses("2", "Long Rest"), action("Rage", "bonusAction")], // B/P/S resistance is only "while raging" → situational, skip
    "Barbarian/Unarmored Defense": [ac("10", "dex,con")],
    "Barbarian/Danger Sense": [adv("SavingThrow", { stat: "dex", condition: "unless Incapacitated" })],
    "Barbarian/Ability Score Improvement": [asi()],
    "Barbarian/Extra Attack": [extraAttack()],
    "Barbarian/Fast Movement": [speed("10")],
    "Barbarian/Feral Instinct": [adv("Initiative")],
    // Reckless Attack — self-elected Advantage; the trade-off lives in the condition text.
    "Barbarian/Reckless Attack": [adv("WeaponAttack", { stat: "str", condition: "when attacking recklessly (melee Str attacks; attack rolls against you also have Advantage until your next turn)" })],
    // Primal Knowledge — one more skill from the Barbarian level-1 list (the Rage Str-check rider is situational → skip).
    "Barbarian/Primal Knowledge": [add("Proficiencies", { proficiency: "choice", options: "Animal Handling,Athletics,Intimidation,Nature,Perception,Survival", count: "1" })],
    // Primal Champion: Strength & Constitution increase by 4 (max 25 not representable).
    "Barbarian/Primal Champion": [raiseStat("str", "4"), raiseStat("con", "4")],
    // skip: Weapon Mastery, Brutal Strike / Improved Brutal Strike (damage rider), Relentless Rage
    //       (situational), Indomitable Might (score-as-total), Instinctive Pounce, Epic Boon.
    //       (Persistent Rage is encoded in the sweep block below — its once-per-Long-Rest refresh is a Uses counter.)

    // ============================================================ Bard
    "Bard/Bardic Inspiration": [uses("1", "Long Rest"), action("Bardic Inspiration", "bonusAction")], // uses = Charisma modifier (min 1) — approximated as 1
    "Bard/Ability Score Improvement": [asi()],
    "Bard/Words of Creation": [spell("Power Word Heal"), spell("Power Word Kill")],
    // skip: Expertise (skill choice), Jack of All Trades, Font of Inspiration (recharge change),
    //       Countercharm, Magical Secrets, Superior Inspiration, Epic Boon.

    // ============================================================ Cleric
    // Channel Divinity's two effects are both "As a Magic action" — granted as named actions.
    "Cleric/Channel Divinity": [
        uses("2", "Long Rest"), // one use back on a Short Rest, all on a Long Rest
        action("Divine Spark", "action", "Channel Divinity"),
        action("Turn Undead", "action", "Channel Divinity"),
    ],
    "Cleric/Divine Intervention": [uses("1", "Long Rest")],
    "Cleric/Ability Score Improvement": [asi()],
    // skip: Divine Order (choice), Sear Undead (rider), Blessed Strikes / Improved Blessed Strikes
    //       (choice + rider), Greater Divine Intervention, Epic Boon.

    // ============================================================ Druid
    // Druidic: grants the Druidic language and always-prepared Speak with Animals.
    "Druid/Druidic": [language("Druidic"), spell("Speak with Animals")],
    "Druid/Wild Shape": [uses("2", "Long Rest"), action("Wild Shape", "bonusAction")], // one use back on a Short Rest, all on a Long Rest
    // "As a Magic action, you can expend a spell slot or a use of Wild Shape to cast Find Familiar"
    "Druid/Wild Companion": [action("Wild Companion", "action", undefined, "expend a spell slot or a use of Wild Shape to cast Find Familiar without Material components")],
    "Druid/Ability Score Improvement": [asi()],
    // skip: Primal Order (choice), Wild Resurgence (slot/shape conversion),
    //       Elemental Fury / Improved Elemental Fury (choice + rider), Beast Spells, Archdruid, Epic Boon.

    // ============================================================ Fighter
    "Fighter/Second Wind": [uses("2", "Long Rest"), action("Second Wind", "bonusAction")],
    "Fighter/Action Surge (one use)": [uses("1", "Short Rest")],
    "Fighter/Extra Attack": [extraAttack()], // total 2
    "Fighter/Indomitable (one use)": [uses("1", "Long Rest")],
    "Fighter/Two Extra Attacks": [extraAttack()], // +1 over Extra Attack → total 3
    "Fighter/Three Extra Attacks": [extraAttack()], // +1 over Two Extra Attacks → total 4
    "Fighter/Ability Score Improvement": [asi()],
    // skip: Fighting Style (feat choice), Weapon Mastery, Tactical Mind/Shift/Master,
    //       "Action Surge (two uses)" & "Indomitable (two/three uses)" (extra uses are scaling of the
    //       same resource — the base grant already carries the Uses command), Epic Boon.
    //       (Studied Attacks is encoded in the sweep block below as conditional Advantage.)

    // ============================================================ Monk
    // Martial Arts' Bonus Action Unarmed Strike is unconditional in 2024 (the die stays in the table).
    "Monk/Martial Arts": [action("Unarmed Strike", "bonusAction", "Martial Arts")],
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
    // skip: Martial Arts' die/dex-substitution (only the Bonus Action strike is encoded above),
    //       Slow Fall, Stunning Strike (rider), Empowered Strikes,
    //       Evasion, Acrobatic Movement, Heightened Focus, Self-Restoration, Deflect Attacks/Energy,
    //       Perfect Focus, Superior Defense (situational resistance), Epic Boon.

    // ============================================================ Paladin
    "Paladin/Paladin's Smite": [spell("Divine Smite"), uses("1", "Long Rest")], // free cast once per Long Rest
    // Channel Divinity's SRD effect is Divine Sense — "As a Bonus Action, you can open your awareness..."
    "Paladin/Channel Divinity": [uses("2", "Long Rest"), action("Divine Sense", "bonusAction", "Channel Divinity")],
    "Paladin/Extra Attack": [extraAttack()],
    "Paladin/Faithful Steed": [spell("Find Steed"), uses("1", "Long Rest")], // free cast once per Long Rest
    // Lay On Hands — the healing POOL still has no category; the Bonus Action to spend from it is encoded.
    "Paladin/Lay On Hands": [action("Lay On Hands", "bonusAction")],
    // "As a Magic action, you can expend one use of this class's Channel Divinity..."
    "Paladin/Abjure Foes": [action("Abjure Foes", "action", "Channel Divinity")],
    "Paladin/Ability Score Improvement": [asi()],
    // skip: Lay On Hands' HP pool (no category), Weapon Mastery, Fighting Style (choice),
    //       Aura of Protection (flat +CHA to saves, not proficiency/advantage),
    //       Aura of Courage (Frightened-immunity is a condition, not a damage type), Radiant Strikes
    //       (rider), Restoring Touch, Aura Expansion, Epic Boon.

    // ============================================================ Ranger
    "Ranger/Favored Enemy": [spell("Hunter's Mark"), uses("2", "Long Rest")], // free Hunter's Mark casts
    "Ranger/Extra Attack": [extraAttack()],
    // Roving: +10 ft, "You also have a Climb Speed and a Swim Speed equal to your Speed."
    "Ranger/Roving": [speed("10"), movement("climb"), movement("swim")],
    "Ranger/Nature's Veil": [uses("1", "Long Rest")], // uses = Wisdom modifier (min 1) — approximated as 1
    // "grants you Blindsight with a range of 30 feet"
    "Ranger/Feral Senses": [senses("blindsight", "30")],
    "Ranger/Ability Score Improvement": [asi()],
    // skip: Weapon Mastery, Deft Explorer (expertise/language choice), Fighting Style (choice),
    //       Expertise (skill choice), Tireless (temp HP), Relentless Hunter, Precise Hunter (situational
    //       adv), Foe Slayer, Epic Boon.

    // ============================================================ Rogue
    "Rogue/Thieves' Cant": [language("Thieves' Cant")], // the "one other language of your choice" → skip
    // "On your turn, you can take one of the following actions as a Bonus Action: Dash, Disengage, or Hide."
    "Rogue/Cunning Action": [action("Cunning Action", "bonusAction", undefined, "Dash, Disengage, or Hide")],
    "Rogue/Slippery Mind": [savingThrow("wis"), savingThrow("cha")],
    "Rogue/Stroke of Luck": [uses("1", "Short Rest")],
    "Rogue/Ability Score Improvement": [asi()],
    // skip: Expertise (skill choice), Sneak Attack (rider), Weapon Mastery, Steady Aim
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

    // ================================================================
    // Coverage-gap sweep (July 2026): entries below were proposed and
    // adversarially verified against the parsed SRD text.
    // ================================================================
    // 'you can regain all expended uses of Rage ... you can't do so again until you finish a Long Rest' is a genuine once-per-Long-Rest resource refresh, st
    "Barbarian/Persistent Rage": [
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Long Rest" } },
    ],
    // 'If you make an attack roll against a creature and miss, you have Advantage on your next attack roll against that creature before the end of your next
    "Fighter/Studied Attacks": [
        { type: "Add", category: "Advantage", value: { rollType: "WeaponAttack", mode: "advantage", condition: "on your next attack roll against a creature you missed with an attack roll, before the end of your next turn" } },
    ],
    // "You can use this action a number of times equal to your Wisdom modifier (minimum of once), and you regain all expended uses when you finish a Long Re
    "Ranger/Tireless": [
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Long Rest" } },
    ],
    // "You have Advantage on attack rolls against the creature currently marked by your Hunter's Mark" — conditional advantage, encoded per the Advantage po
    "Ranger/Precise Hunter": [
        { type: "Add", category: "Advantage", value: { rollType: "WeaponAttack", mode: "advantage", condition: "against the creature currently marked by your Hunter's Mark" } },
    ],
    // "As a Bonus Action, you give yourself Advantage on your next attack roll on the current turn" — self-activated advantage, encoded per the Advantage po
    "Rogue/Steady Aim": [
        { type: "Add", category: "Advantage", value: { rollType: "WeaponAttack", mode: "advantage", condition: "as a Bonus Action, gives Advantage on your next attack roll this turn; usable only if you haven't moved this turn, and your Speed becomes 0 until the end of the turn" } },
    ],
};

/*
 * Coverage-gap sweep (July 2026) — documented SKIPS (verified; no fitting category or
 * deliberately out of scope per the decision rules):
 *  - Barbarian/Brutal Strike: You 'forgo any Advantage' (grant nothing) for 'an extra 1d10 damage' plus Forceful/Hamstring Blow positioning effects on the target; a damage rider ha
 *  - Barbarian/Improved Brutal Strike: Adds Staggering Blow ('target has Disadvantage on the next saving throw it makes') and Sundering Blow ('next attack roll made by another creature ... 
 *  - Bard/Expertise: 'You gain Expertise ... in two of your skill proficiencies of your choice' — the Expertise command takes fixed named skills only and has no choice for
 *  - Bard/Expertise: Level-9 grant is again 'Expertise in two more of your skill proficiencies of your choice' — no fixed skills; Expertise has no choice form. Catalog Exp
 *  - Cleric/Divine Order: A role choice: Protector gives 'proficiency with Martial weapons and training with Heavy armor' (weapon/armor, not a canonical skill, so outside the s
 *  - Druid/Primal Order: Role choice mirroring Divine Order: Warden gives 'proficiency with Martial weapons and training with Medium armor' (not skill proficiencies) or Magici
 *  - Monk/Superior Defense: 'expend 3 Focus Points to bolster yourself ... for 1 minute ... you have Resistance to all damage except Force damage' — a temporary activated buff pa
 *  - Paladin/Aura of Protection: 'you and your allies in the aura gain a bonus to saving throws equal to your Charisma modifier (minimum bonus of +1)' — the bonus is an ability modifi
 *  - Paladin/Aura of Courage: 'You and your allies have Immunity to the Frightened condition' — Immunities is damage-type-only; the Frightened condition has no category. Matches cu
 *  - Paladin/Epic Boon: 'You gain an Epic Boon feat ... or another feat of your choice' — a choice of feat; the Truesight-granting Boon of Truesight is only 'recommended', no
 *  - Ranger/Deft Explorer: Both benefits are player-choice with no fixed grant: "Choose one of your skill proficiencies with which you lack Expertise. You gain Expertise in that
 *  - Ranger/Expertise: "Choose two of your skill proficiencies with which you lack Expertise. You gain Expertise in those skills" — expertise in skills of your choice has no
 *  - Rogue/Expertise: "You gain Expertise in two of your skill proficiencies of your choice" — expertise in skills of your choice has no choice form (Expertise is fixed-ski
 *  - Rogue/Sneak Attack: "you can deal an extra 1d6 damage ... if you have Advantage on the roll" — this is a damage rider (no damage-rider category), and the Advantage refere
 *  - Rogue/Expertise: Level-6 Expertise row: "You gain Expertise in two of your skill proficiencies of your choice" — same player-choice expertise as the level-1 grant, no 
 *  - Wizard/Scholar: "Choose one of the following skills in which you have proficiency: Arcana, History, Investigation, Medicine, Nature, or Religion. You have Expertise i
 */

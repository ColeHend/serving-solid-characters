import type { CommandSpecInput, MadMap } from "../spec.ts";

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
 * Ability Score Improvement is modeled as two +1 picks of the player's choice (choice-form Stats
 * with count: "2"; the same ability may be picked twice for the "+2 to one score" form).
 */

// an activated ability: a new action/bonusAction/reaction on the sheet; source (defaults to the
// action's name) = the granting feature's EXACT name, linking to its featureUses counter;
// description = a short cost/condition qualifier when the grant isn't unconditional
const action = (name: string, actionType: string, source?: string, description?: string): CommandSpecInput =>
    ({ type: "Add", category: "Actions", value: { name, actionType, source: source ?? name, ...(description ? { description } : {}) } });

// ASI: two +1 picks of the player's choice; the same ability twice = +2 (count picks, repeats allowed).
const asi = (): CommandSpecInput =>
    ({ type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "1", count: "2" } });

// choice-form Expertise: the player picks N skills (the sheet limits the picker to proficient skills).
const ALL_SKILLS = "Acrobatics,Animal Handling,Arcana,Athletics,Deception,History,Insight,Intimidation,Investigation,Medicine,Nature,Perception,Performance,Persuasion,Religion,Sleight Of Hand,Stealth,Survival";
const expertiseChoice = (count: string): CommandSpecInput =>
    ({ type: "Add", category: "Expertise", value: { proficiency: "choice", options: ALL_SKILLS, count } });

// choice-form Languages: the player picks N languages from the standard list.
const STANDARD_LANGUAGES = "Common,Undercommon,Abyssal,Infernal,Celestial,Primordial,Draconic,Dwarvish,Elvish,Giant,Gnomish,Goblin,Halfling,Orc,Sylvan,Deep Speech";
const languageChoice = (count: string): CommandSpecInput =>
    ({ type: "Add", category: "Languages", value: { name: "choice", options: STANDARD_LANGUAGES, count } });

export const map: MadMap = {
    // ----- Barbarian -----
    "Barbarian/Rage": [
        // base 2 rages/long rest; scaling (3/4/5/unlimited) stays in classSpecific "Rages"
        { type: "Add", category: "Uses", value: { amount: "2", recharge: "Long Rest" } },
        action("Rage", "bonusAction"), // "you can enter a rage as a bonus action"
    ],
    "Barbarian/Unarmored Defense": [
        { type: "Add", category: "ArmorClass", value: { bonus: "10", stats: "dex,con" } },
    ],
    "Barbarian/Danger Sense": [
        // permanent, unconditional-while-able: advantage on Dex saves vs effects you can see
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", stat: "dex", condition: "against effects you can see" } },
    ],
    "Barbarian/Ability Score Improvement": [asi()],
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
        action("Bardic Inspiration", "bonusAction", "Bardic Inspiration (d6)"), // "you use a bonus action on your turn"
    ],
    "Bard/Ability Score Improvement": [asi()],
    // "Choose two of your skill proficiencies. Your proficiency bonus is doubled..." (levels 3 and
    // 10 — each level instance keys its own picks on the sheet)
    "Bard/Expertise": [expertiseChoice("2")],
    // skipped: Jack of All Trades (half PB to ANY ability check not already proficient — applies to
    //   raw ability checks, not an enumerable skill set), Song of Rest (short-rest healing),
    //   Font of Inspiration (changes Bardic Inspiration
    //   recharge), Countercharm (advantage only while performing — situational), Magical Secrets
    //   (player-choice spells), Superior Inspiration (situational), die upgrades (d8/d10/d12).

    // ----- Cleric -----
    "Cleric/Ability Score Improvement": [asi()],
    // apply.ts splits map keys on the FIRST "/" only, so the "/" inside the feature name is fine.
    "Cleric/Channel Divinity (1/rest)": [
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Short Rest" } },
        action("Turn Undead", "action", "Channel Divinity (1/rest)"), // "As an action, you present your holy symbol"
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
        action("Wild Shape", "action"), // "you can use your action to magically assume the shape"
    ],
    "Druid/Ability Score Improvement": [asi()],
    // skipped: Wild Shape Improvement (raises beast CR/limits), Timeless Body (aging), Beast Spells
    //   (cast while shaped), Archdruid (unlimited Wild Shape — cap), Druid Circle (subclass).

    // ----- Fighter -----
    "Fighter/Second Wind": [
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Short Rest" } },
        action("Second Wind", "bonusAction"), // "you can use a bonus action to regain hit points"
    ],
    "Fighter/Action Surge (one use)": [
        // base 1 use/short rest; "Action Surge (two uses)" at L17 is a separate scaling feature
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Short Rest" } },
    ],
    "Fighter/Ability Score Improvement": [asi()],
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
    // Martial Arts' bonus-action strike is conditional on the Attack action — carried in description.
    "Monk/Martial Arts": [
        action("Unarmed Strike", "bonusAction", "Martial Arts", "after you take the Attack action with an unarmed strike or a monk weapon"),
    ],
    // Ki's three named bonus actions (the ki-point resource itself stays unrepresented).
    "Monk/Ki": [
        action("Flurry of Blows", "bonusAction", "Ki", "spend 1 ki point immediately after you take the Attack action: two unarmed strikes"),
        action("Patient Defense", "bonusAction", "Ki", "spend 1 ki point: take the Dodge action"),
        action("Step of the Wind", "bonusAction", "Ki", "spend 1 ki point: Disengage or Dash, and your jump distance is doubled for the turn"),
    ],
    "Monk/Unarmored Movement": [
        // base +10 ft; scaling stays in classSpecific "Unarmored Movement"
        { type: "Add", category: "Speed", value: { speed: "10" } },
    ],
    "Monk/Ability Score Improvement": [asi()],
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
    // skipped: Martial Arts' die/dex-substitution (only the bonus-action strike is encoded above),
    //   Ki's point resource (only its three bonus actions are encoded above), Deflect Missiles,
    //   Slow Fall, Stunning Strike, Ki-Empowered Strikes (magical strikes — no category), Evasion,
    //   Stillness of Mind, Unarmored Movement improvement (scaling), Tongue of the Sun and Moon
    //   (understand all languages — not a specific language), Timeless Body, Empty Body (temporary
    //   invisibility/resistance), Perfect Self (ki regen), Monastic Tradition (subclass).

    // ----- Paladin -----
    "Paladin/Divine Sense": [
        // approximation: uses = 1 + Charisma modifier
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Long Rest" } },
        action("Divine Sense", "action"), // "As an action, you can open your awareness"
    ],
    // Lay on Hands — the healing POOL still has no category; the action to spend from it is encoded.
    "Paladin/Lay on Hands": [
        action("Lay on Hands", "action"), // "As an action, you can touch a creature"
    ],
    "Paladin/Ability Score Improvement": [asi()],
    "Paladin/Extra Attack": [
        { type: "Add", category: "Attacks", value: { amount: "1" } },
    ],
    "Paladin/Cleansing Touch": [
        // approximation: uses = Charisma modifier (min 1)
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Long Rest" } },
    ],
    // "the divine magic flowing through you makes you immune to disease"
    "Paladin/Divine Health": [
        { type: "Add", category: "Immunities", value: { condition: "Disease" } },
    ],
    // skipped: Lay on Hands' HP pool (not a use count), Divine Smite / Improved Divine Smite
    //   (radiant damage riders), Aura of Protection
    //   (numeric save bonus — no category), Aura of Courage (can't be frightened — condition, no
    //   category), Aura improvements (range scaling), Fighting Style (player-choice), Spellcasting,
    //   Sacred Oath (subclass).

    // ----- Ranger -----
    "Ranger/Ability Score Improvement": [asi()],
    "Ranger/Extra Attack": [
        { type: "Add", category: "Attacks", value: { amount: "1" } },
    ],
    // "you can use the Hide action as a bonus action on your turn"
    "Ranger/Vanish": [
        action("Vanish", "bonusAction", undefined, "use the Hide action as a bonus action"),
    ],
    // "You also learn one language of your choice that is spoken by your favored enemy" — the base
    // grant and each improvement row (L6/L14) carry one language pick apiece (the improvement rows
    // are distinct features, so each level instance keys its own pick). The tracking/recall
    // advantage on the base feature is encoded in the sweep block below.
    "Ranger/Favored Enemy and Natural Explorer improvements": [languageChoice("1")],
    "Ranger/Favored Enemy improvement": [languageChoice("1")],
    // skipped: Natural Explorer (doubled PB only in favored terrain), Fighting
    //   Style (player-choice), Primeval Awareness, Land's Stride (advantage vs impeding plants —
    //   conditional), Hide in Plain Sight (conditional Stealth bonus), Vanish's untrackable rider,
    //   Feral Senses, Foe Slayer (situational), Ranger Archetype (subclass).

    // ----- Rogue -----
    "Rogue/Thieves' Cant": [
        { type: "Add", category: "Languages", value: { name: "Thieves' Cant" } },
    ],
    // "You can take a bonus action on each of your turns ... only to take the Dash, Disengage, or Hide action."
    "Rogue/Cunning Action": [
        action("Cunning Action", "bonusAction", undefined, "Dash, Disengage, or Hide"),
    ],
    "Rogue/Ability Score Improvement": [asi()],
    "Rogue/Slippery Mind": [
        { type: "Add", category: "SavingThrows", value: { stat: "wis" } },
    ],
    // "choose two of your skill proficiencies, or one ... and your proficiency with thieves' tools"
    // (levels 1 and 6). The thieves'-tools alternative isn't a skill and stays narrative.
    "Rogue/Expertise": [expertiseChoice("2")],
    // skipped: Sneak Attack (damage rider),
    //   Uncanny Dodge, Evasion, Reliable Talent, Blindsense, Elusive (denies enemies
    //   advantage — no category), Stroke of Luck (miss→hit / treat check as 20 — DM adjudication),
    //   Roguish Archetype (subclass).

    // ----- Sorcerer -----
    "Sorcerer/Ability Score Improvement": [asi()],
    // Font of Magic's bonus-action conversions (the sorcery-point resource itself stays unrepresented).
    "Sorcerer/Font of Magic": [
        action("Flexible Casting", "bonusAction", "Font of Magic", "convert sorcery points into a spell slot, or a spell slot into sorcery points"),
    ],
    // skipped: Font of Magic's sorcery-point resource (only Flexible Casting is encoded above),
    //   Metamagic (player-choice options), Sorcerous Restoration (resource regen),
    //   Sorcerous Origin (subclass), Spellcasting.

    // ----- Warlock -----
    "Warlock/Ability Score Improvement": [asi()],
    // skipped: Pact Magic (spell slots), Mystic Arcanum (player-choice spell), Eldritch Master
    //   (slot recovery), Otherworldly Patron (subclass).
    // Eldritch Invocations + Pact Boon are curated as OPTION lists in mads/2014/invocations.ts.

    // ----- Wizard -----
    "Wizard/Ability Score Improvement": [asi()],
    // skipped: Arcane Recovery (slot recovery), Spell Mastery / Signature Spell (player-choice
    //   spells), Arcane Tradition (subclass), Spellcasting.

    // ================================================================
    // Coverage-gap sweep (July 2026): entries below were proposed and
    // adversarially verified against the parsed SRD text.
    // ================================================================
    // SRD: 'gives you advantage on melee weapon attack rolls using Strength during this turn, but attack rolls against you have advantage until your next tu
    "Barbarian/Reckless Attack": [
        { type: "Add", category: "Advantage", value: { rollType: "WeaponAttack", mode: "advantage", stat: "str", condition: "when attacking recklessly (melee Str attacks; attack rolls against you also have Advantage until your next turn)" } },
    ],
    // SRD: 'you and any friendly creatures within 30 feet of you have advantage on saving throws against being frightened or charmed.' Self-activated condit
    "Bard/Countercharm": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "while performing Countercharm (an action, until end of your next turn) against being frightened or charmed; you and friendly creatures within 30 ft must be able to hear you" } },
    ],
    // "You have advantage on Wisdom (Survival) checks to track your favored enemies, as well as on Intelligence checks to recall information about them." Pe
    "Ranger/Favored Enemy": [
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", stat: "wis", condition: "on Wisdom (Survival) checks to track your favored enemies" } },
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", stat: "int", condition: "on Intelligence checks to recall information about your favored enemies" } },
        // "You also learn one language of your choice that is spoken by your favored enemy"
        languageChoice("1"),
    ],
    // "you have advantage on saving throws against plants that are magically created or manipulated to impede movement, such those created by the entangle s
    "Ranger/Land's Stride": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against plants magically created or manipulated to impede movement (e.g. entangle)" } },
    ],
};

/*
 * Coverage-gap sweep (July 2026) — documented SKIPS (verified; no fitting category or
 * deliberately out of scope per the decision rules):
 *  - Bard/Spellcasting: Cantrips and Spells Known are all 'of your choice from the bard spell list' — no fixed spell to grant, and Spells has no list-choice form (rule 6). Sp
 *  - Bard/Bardic Inspiration (d8): Die-upgrade tier: description is identical to the base feature, only 'the die becomes a d8 at 5th level'. Base Bardic Inspiration (d6) already carries
 *  - Bard/Bardic Inspiration (d10): Die-upgrade tier: identical description, only 'the die becomes a d10 at 10th level'. Base Bardic Inspiration (d6) already carries the Uses command; a
 *  - Bard/Bardic Inspiration (d12): Die-upgrade tier: identical description, only 'the die becomes a d12 at 15th level'. Base Bardic Inspiration (d6) already carries the Uses command; a
 *  - Cleric/Channel Divinity (2/rest): Use-count scaling: 'Beginning at 6th level, you can use your Channel Divinity twice between rests.' Base Channel Divinity (1/rest) already carries the
 *  - Cleric/Channel Divinity (3/rest): Use-count scaling: 'beginning at 18th level, you can use it three times between rests.' Base Channel Divinity (1/rest) already carries the Uses comman
 *  - Druid/Wild Shape Improvement: Raises the beast-form pool only (Beast Shapes table: max CR 1/4->1/2->1, removing the 'No swimming'/'No flying speed' limits). Any fly/swim speed come
 *  - Druid/Wild Shape Improvement: Same feature, higher tier: it only widens which beasts you may assume (removing the flying-speed limit at 8th). Fly/swim speed is a property of the te
 *  - Fighter/Fighting Style: Player-choice pick ("Choose one of the following options") — catalog says choice-of-fighting-style is skipped. The "disadvantage" trigger is Protectio
 *  - Monk/Ki-Empowered Strikes: "your unarmed strikes count as magical for the purpose of overcoming resistance and immunity to nonmagical attacks and damage" — this overcomes an ENE
 *  - Monk/Unarmored Movement improvement: Description repeats the base "your speed increases by 10 feet" which is already encoded on Monk/Unarmored Movement; the +15/+20/etc. scaling stays in 
 *  - Monk/Empty Body: Temporary activated effect: "spend 4 ki points to become invisible for 1 minute. During that time, you also have resistance to all damage but force da
 *  - Paladin/Fighting Style: Player-choice pick ("Choose one of the following options"). The "disadvantage" trigger is Protection's "impose disadvantage on the attack roll" — impo
 *  - Ranger/Natural Explorer: "your proficiency bonus is doubled if you are using a skill that you're proficient in" applies only to Int/Wis checks related to your player-chosen fa
 *  - Ranger/Fighting Style: Player-choice pick ("Choose one of the following options"). Archery's "+2 bonus to attack rolls you make with ranged weapons" (the flat-roll-bonus tri
 *  - Ranger/Spellcasting: "You know two 1st-level spells of your choice from the ranger spell list" — player-choice spells from a list, not a fixed grant. The Spells command is
 *  - Ranger/Favored Enemy and Natural Explorer improvements: L6/L14 improvement row ("You choose one additional favored enemy... at 6th and 14th level") granting additional player-chosen enemies/terrains. Its ad
 *  - Ranger/Natural Explorer improvement: "your proficiency bonus is doubled if you are using a skill that you're proficient in" applies only in a player-chosen favored terrain and only to ski
 *  - Ranger/Favored Enemy improvement: L6/L14 upgrade tier of base Favored Enemy. The conditional advantage ("advantage on Wisdom (Survival) checks to track your favored enemies, as well as
 *  - Ranger/Feral Senses: "your inability to see it doesn't impose disadvantage on your attack rolls" negates a normally-applied disadvantage — there is no "cancel disadvantage
 *  - Rogue/Sneak Attack: Damage rider ("deal an extra 1d6 damage") — no damage category (rule 5). The "if you have advantage on the attack roll" clause is a precondition for t
 * (Former entries in this block — Bard/Rogue Expertise and Paladin/Divine Health — are encoded in
 * the map above via the Expertise choice form and the Immunities condition field; the Favored
 * Enemy rows now also carry their language picks.)
 *  - Sorcerer/Spellcasting: All grants are player-choice from the sorcerer list ("four cantrips of your choice", "two 1st-level spells of your choice"); no fixed always-known spe
 *  - Sorcerer/Metamagic: L3 Metamagic: player-choice options ("two of the following Metamagic options of your choice") — no choice form. The disadvantage trigger is Heightened
 *  - Sorcerer/Metamagic: L10 row grants one additional player-choice Metamagic option (tier); same non-encodable content as L3 — player-choice options, and Heightened Spell's 
 *  - Sorcerer/Metamagic: L17 row grants one additional player-choice Metamagic option (tier); same non-encodable content as L3 — player-choice options, and Heightened Spell's 
 *  - Warlock/Pact Boon: Player-choice feature ("one of the following features of your choice"). The "immunity" trigger is Pact of the Blade's weapon "counts as magical for th
 */

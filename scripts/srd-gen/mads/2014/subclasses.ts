import type { MadMap } from "../spec.ts";

/**
 * Curated MADS commands for the SRD 5.1 (2014) SUBCLASS features. Keys are
 * "<Subclass>/<Feature name>" using the parser's SHORTENED subclass display name — the same
 * name stored in subclasses.json and matched by mads/apply.ts (e.g. "Path of the Berserker" →
 * "Berserker", "Life Domain" → "Life", "Draconic Bloodline" → "Draconic", "The Fiend" → "Fiend").
 * Feature names match the subclass's #### headings verbatim.
 *
 * Domain/oath spell lists: the parser already stamps metadata.spells on the lowest-level granting
 * feature (Life → "Bonus Proficiency", Devotion → "Oath Spells"); we ALSO emit an AddSpells command
 * per spell there so the grant lands on the character sheet. Only effects the text literally states
 * are encoded — see the // skipped notes.
 *
 * Eight subclasses (Berserker, Lore, Champion, Open Hand, Hunter, Thief, Fiend, Evocation) contribute
 * NO commands: their features are all situational, damage/crit riders, healing, player-choice picks,
 * or spell-mechanic modifiers with no representable permanent effect. See the trailing note.
 */
export const map: MadMap = {
    // ----- Lore (Bard, College of Lore) -----
    // "you gain proficiency with three skills of your choice."
    "Lore/Bonus Proficiencies": [
        { type: "Add", category: "Proficiencies", value: {
            proficiency: "choice",
            options: "Acrobatics,Animal Handling,Arcana,History,Athletics,Deception,Insight,Intimidation,Investigation,Medicine,Nature,Perception,Performance,Persuasion,Religion,Sleight Of Hand,Stealth,Survival",
            count: "3",
        } },
    ],
    // skipped (Lore): Cutting Words / Peerless Skill (spend Bardic Inspiration), Additional Magical
    //   Secrets (player-choice spells).

    // ----- Life (Cleric, Life Domain) -----
    // Domain spells are always prepared → grant each. (Heavy-armor proficiency has no armor-prof
    // category and is skipped; the spell list is stamped on this feature by the parser.)
    "Life/Bonus Proficiency": [
        { type: "Add", category: "Spells", target: "bless", value: {} },
        { type: "Add", category: "Spells", target: "cure wounds", value: {} },
        { type: "Add", category: "Spells", target: "lesser restoration", value: {} },
        { type: "Add", category: "Spells", target: "spiritual weapon", value: {} },
        { type: "Add", category: "Spells", target: "beacon of hope", value: {} },
        { type: "Add", category: "Spells", target: "revivify", value: {} },
        { type: "Add", category: "Spells", target: "death ward", value: {} },
        { type: "Add", category: "Spells", target: "guardian of faith", value: {} },
        { type: "Add", category: "Spells", target: "mass cure wounds", value: {} },
        { type: "Add", category: "Spells", target: "raise dead", value: {} },
    ],
    // skipped (Life): Disciple of Life / Blessed Healer / Supreme Healing (healing), Divine Strike
    //   (radiant damage rider), Channel Divinity: Preserve Life (spends the shared Channel Divinity use).

    // ----- Devotion (Paladin, Oath of Devotion) -----
    "Devotion/Oath Spells": [
        { type: "Add", category: "Spells", target: "protection from evil and good", value: {} },
        { type: "Add", category: "Spells", target: "sanctuary", value: {} },
        { type: "Add", category: "Spells", target: "lesser restoration", value: {} },
        { type: "Add", category: "Spells", target: "zone of truth", value: {} },
        { type: "Add", category: "Spells", target: "beacon of hope", value: {} },
        { type: "Add", category: "Spells", target: "dispel magic", value: {} },
        { type: "Add", category: "Spells", target: "freedom of movement", value: {} },
        { type: "Add", category: "Spells", target: "guardian of faith", value: {} },
        { type: "Add", category: "Spells", target: "commune", value: {} },
        { type: "Add", category: "Spells", target: "flame strike", value: {} },
    ],
    "Devotion/Channel Divinity": [
        // Paladin Channel Divinity = 1 use, recharge on a short or long rest (Sacred Oath rules)
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Short Rest" } },
    ],
    // skipped (Devotion): Tenets of Devotion (roleplay), Aura of Devotion (can't be charmed —
    //   condition, no category), Holy Nimbus (once/long-rest damage aura — situational nova).

    // ----- Land (Druid, Circle of the Land) -----
    "Land/Nature's Ward": [
        // "immune to poison and disease" — poison damage-type immunity (disease has no category)
        { type: "Add", category: "Immunities", value: { damageType: "Poison" } },
    ],
    // skipped (Land): Bonus Cantrip (player-choice cantrip), Natural Recovery (slot recovery),
    //   Circle Spells (player chooses a terrain — one of seven spell lists, not a fixed grant),
    //   Land's Stride (advantage vs impeding plants — conditional), Nature's Sanctuary (situational).
    //   The charm/fright-by-fey-and-elementals part of Nature's Ward is creature-conditional — skipped.

    // ----- Draconic (Sorcerer, Draconic Bloodline) -----
    "Draconic/Dragon Ancestor": [
        { type: "Add", category: "Languages", value: { name: "Draconic" } },
    ],
    "Draconic/Draconic Resilience": [
        // unarmored AC = 13 + Dex modifier, and "your hit point maximum increases by 1 and increases by
        // 1 again whenever you gain a level in this class" (per SORCERER level — the perLevel command
        // scales by character level, exact for single-class sorcerers).
        { type: "Add", category: "ArmorClass", value: { bonus: "13", stats: "dex" } },
        { type: "Add", category: "HitPoints", value: { amount: "1", perLevel: "true" } },
    ],
    // "you gain a flying speed equal to your current speed" — at-will wings (bonus action, last until
    // dismissed) → a Movement grant; no explicit speed = equal to the walking Speed.
    "Draconic/Dragon Wings": [
        { type: "Add", category: "Movement", value: { movementType: "fly" } },
    ],
    // skipped (Draconic): Elemental Affinity (damage + situational resistance), Draconic Presence
    //   (once/rest fear/charm aura).

    // ----- Berserker (Barbarian, Path of the Berserker) -----
    // Frenzy — "you can make a single melee weapon attack as a bonus action on each of your turns"
    // while in a frenzied rage (the exhaustion cost when the rage ends stays in the text).
    "Berserker/Frenzy": [
        { type: "Add", category: "Actions", value: { name: "Frenzy Attack", actionType: "bonusAction", source: "Frenzy", description: "while in a frenzied rage: one melee weapon attack as a bonus action on each of your turns" } },
    ],
    // Retaliation — "when you take damage from a creature that is within 5 feet of you, you can use
    // your reaction to make a melee weapon attack against that creature."
    "Berserker/Retaliation": [
        { type: "Add", category: "Actions", value: { name: "Retaliation", actionType: "reaction", description: "when you take damage from a creature within 5 feet of you: make a melee weapon attack against it" } },
    ],

    // ----- No-command subclasses -----
    // Berserker (rest): Mindless Rage (charm/fright immunity only while raging), Intimidating
    //   Presence (frighten action).
    // Champion: Improved/Superior Critical (crit-range riders), Remarkable Athlete (half PB to raw
    //   STR/DEX/CON checks — not an enumerable skill set), Additional Fighting Style (player-choice),
    //   Survivor (per-turn healing).
    // Open Hand: Open Hand Technique / Quivering Palm (attack riders), Wholeness of Body (self-heal),
    //   Tranquility (sanctuary at end of long rest — situational).
    // Hunter: every tier (Hunter's Prey, Defensive Tactics, Multiattack, Superior Hunter's Defense)
    //   is a "choose one of the following" player pick.
    // Thief: Fast Hands / Second-Story Work / Supreme Sneak / Use Magic Device / Thief's Reflexes —
    //   conditional or non-representable utility.
    // Fiend: Expanded Spell List (EXPANDS the choosable list — not auto-granted, unlike domain spells),
    //   Dark One's Blessing (temp HP), Dark One's Own Luck (add d10 — Lucky-like), Fiendish Resilience
    //   (player-chosen resistance that changes each rest), Hurl Through Hell (once/rest damage nova).
    // Evocation: Evocation Savant / Sculpt Spells / Potent Cantrip / Empowered Evocation / Overchannel
    //   — all spell-mechanic modifiers with no character-sheet effect.

    // ================================================================
    // Coverage-gap sweep (July 2026): entries below were proposed and
    // adversarially verified against the parsed SRD text.
    // ================================================================
    // "you have advantage on saving throws against plants that are magically created or manipulated to impede movement, such those created by the entangle s
    "Land/Land's Stride": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "against plants that are magically created or manipulated to impede movement, such as those created by the entangle spell" } },
    ],
    // "Once you use this feature, you can't use it again until you finish a long rest" — a per-long-rest limited-use feature (rule 4 = Uses-only when a per-
    "Devotion/Holy Nimbus": [
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Long Rest" } },
    ],
    // "you have advantage on a Dexterity (Stealth) check if you move no more than half your speed on the same turn." Self-activated conditional advantage (r
    "Thief/Supreme Sneak": [
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", stat: "dex", condition: "on Dexterity (Stealth) checks when you move no more than half your speed on the same turn" } },
    ],
};

/*
 * Coverage-gap sweep (July 2026) — documented SKIPS (verified; no fitting category or
 * deliberately out of scope per the decision rules):
 *  - Lore/Cutting Words: Reaction that spends Bardic Inspiration to subtract the die from an enemy's attack/ability/damage roll; a roll rider, not a character change. "The cre
 *  - Land/Nature's Sanctuary: Beast/plant attackers must make a Wis save or miss/retarget; "On a successful save, the creature is immune to this effect for 24 hours" is the ENEMY b
 *  - Hunter/Defensive Tactics: "you gain one of the following features of your choice" — player picks ONE of three (Escape the Horde / Multiattack Defense / Steel Will). The "advant
 *  - Draconic/Elemental Affinity: "add your Charisma modifier to one damage roll" is a damage rider (rule 5), and "spend 1 sorcery point to gain resistance to that damage type for 1 ho
 *  - Draconic/Draconic Presence: Activated ability that spends 5 sorcery points to exude a 1-minute charm/fear aura. "A creature that succeeds on this saving throw is immune to your a
 *  - Fiend/Fiendish Resilience: "you can choose one damage type when you finish a short or long rest. You gain resistance to that damage type until you choose a different one" — resi
 */

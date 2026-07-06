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
        // unarmored AC = 13 + Dex modifier (the +1 HP/level increase has no category — skipped)
        { type: "Add", category: "ArmorClass", value: { bonus: "13", stats: "dex" } },
    ],
    // skipped (Draconic): Elemental Affinity (damage + situational resistance), Dragon Wings
    //   (flying speed = current speed — Speed models walking-speed deltas only), Draconic Presence
    //   (once/rest fear/charm aura).

    // ----- No-command subclasses -----
    // Berserker: Frenzy/Retaliation (extra attacks — situational), Mindless Rage (charm/fright
    //   immunity only while raging), Intimidating Presence (frighten action).
    // Lore: Bonus Proficiencies (player-choice skills), Cutting Words / Peerless Skill (spend Bardic
    //   Inspiration), Additional Magical Secrets (player-choice spells).
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
};

import type { CommandSpecInput, MadMap } from "../spec.ts";

/**
 * Curated MADS commands for the SRD 5.2 (2024) SUBCLASSES.
 * Source of truth: the "### <Class> Subclass: <Name>" sections of
 * Docs/dndsrd5.2_markdown-main/src/03_Classes/01_Barbarian.md … 12_Wizard.md
 *
 * Keys are "<Subclass>/<Feature>" where <Subclass> is from the subclass heading (e.g.
 * "Path of the Berserker") and <Feature> is the "#### Level N: <Name>" header name.
 *
 * Same conventions as classes.ts (Uses.recharge = the rest that fully resets; modifier-based use
 * counts approximated to their minimum "1"). Subclasses with no encodable mechanics are omitted:
 *  College of Lore, Circle of the Land, Hunter, Thief, Evoker
 *  (their features are reactions, riders, condition immunities, or choice-dependent grants).
 */

// ---- tiny authoring helpers (all value fields are strings) ----
const add = (category: string, value: Record<string, string>, target?: string): CommandSpecInput =>
    ({ type: "Add", category, value, ...(target ? { target } : {}) });

const uses = (amount: string, recharge: string): CommandSpecInput => add("Uses", { amount, recharge });
const spell = (name: string): CommandSpecInput => add("Spells", {}, name);
const ac = (bonus: string, stats: string): CommandSpecInput => add("ArmorClass", { bonus, stats });
const adv = (rollType: string, extra: Record<string, string> = {}): CommandSpecInput =>
    add("Advantage", { rollType, mode: "advantage", ...extra });
// Always-prepared subclass spell list → one AddSpells per spell on the granting feature.
const spells = (...names: string[]): CommandSpecInput[] => names.map(spell);

export const map: MadMap = {
    // =============================================== Barbarian: Path of the Berserker
    "Path of the Berserker/Intimidating Presence": [uses("1", "Long Rest")], // or restore by expending a Rage
    // skip: Frenzy (damage rider), Mindless Rage (Charmed/Frightened immunity is a condition, not a
    //       damage type), Retaliation (reaction attack).

    // =============================================== Cleric: Life Domain
    "Life Domain/Life Domain Spells": spells(
        "Aid", "Bless", "Cure Wounds", "Lesser Restoration",
        "Mass Healing Word", "Revivify",
        "Aura of Life", "Death Ward",
        "Greater Restoration", "Mass Cure Wounds",
    ),
    // skip: Disciple of Life / Blessed Healer / Supreme Healing (healing riders), Preserve Life
    //       (a Channel Divinity effect — no new use of its own).

    // =============================================== Fighter: Champion
    "Champion/Remarkable Athlete": [
        adv("Initiative"),
        adv("AbilityCheck", { stat: "str", condition: "Athletics" }),
    ],
    "Champion/Survivor": [adv("SavingThrow", { condition: "Death Saving Throws" })], // Heroic Rally (HP regen) → skip
    // skip: Improved Critical / Superior Critical (crit range), Additional Fighting Style (feat choice),
    //       Heroic Warrior (Heroic Inspiration).

    // =============================================== Monk: Warrior of the Open Hand
    "Warrior of the Open Hand/Wholeness of Body": [uses("1", "Long Rest")], // uses = Wisdom modifier (min 1) — approx
    // skip: Open Hand Technique (rider), Fleet Step, Quivering Palm (Focus-Point spend).

    // =============================================== Paladin: Oath of Devotion
    "Oath of Devotion/Oath of Devotion Spells": spells(
        "Protection from Evil and Good", "Shield of Faith",
        "Aid", "Zone of Truth",
        "Beacon of Hope", "Dispel Magic",
        "Freedom of Movement", "Guardian of Faith",
        "Commune", "Flame Strike",
    ),
    "Oath of Devotion/Holy Nimbus": [uses("1", "Long Rest")], // or restore with a level 5 spell slot
    // skip: Sacred Weapon (Channel Divinity effect), Aura of Devotion (Charmed immunity is a condition),
    //       Smite of Protection (Half Cover rider).

    // =============================================== Sorcerer: Draconic Sorcery
    "Draconic Sorcery/Draconic Resilience": [ac("10", "dex,cha")], // +HP-per-level part has no category → skip
    "Draconic Sorcery/Draconic Spells": spells(
        "Alter Self", "Chromatic Orb", "Command", "Dragon's Breath",
        "Fear", "Fly",
        "Arcane Eye", "Charm Monster",
        "Legend Lore", "Summon Dragon",
    ),
    "Draconic Sorcery/Dragon Wings": [uses("1", "Long Rest")], // or restore for 3 Sorcery Points
    "Draconic Sorcery/Dragon Companion": [uses("1", "Long Rest")], // free Summon Dragon cast (already granted at lvl 9)
    // skip: Elemental Affinity (resistance to a CHOSEN damage type).

    // =============================================== Warlock: Fiend Patron
    "Fiend Patron/Fiend Spells": spells(
        "Burning Hands", "Command", "Scorching Ray", "Suggestion",
        "Fireball", "Stinking Cloud",
        "Fire Shield", "Wall of Fire",
        "Geas", "Insect Plague",
    ),
    "Fiend Patron/Dark One's Own Luck": [uses("1", "Long Rest")], // uses = Charisma modifier (min 1) — approx
    "Fiend Patron/Hurl Through Hell": [uses("1", "Long Rest")], // or restore by expending a Pact Magic slot
    // skip: Dark One's Blessing (temp HP), Fiendish Resilience (resistance to a CHOSEN damage type).
};

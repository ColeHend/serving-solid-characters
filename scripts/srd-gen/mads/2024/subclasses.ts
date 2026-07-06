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
 *  Circle of the Land, Hunter, Evoker
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

    // =============================================== Bard: College of Lore
    // "You gain proficiency with three skills of your choice."
    "College of Lore/Bonus Proficiencies": [add("Proficiencies", {
        proficiency: "choice",
        options: "Acrobatics,Animal Handling,Arcana,History,Athletics,Deception,Insight,Intimidation,Investigation,Medicine,Nature,Perception,Performance,Persuasion,Religion,Sleight Of Hand,Stealth,Survival",
        count: "3",
    })],
    // skip: Cutting Words (reaction rider), Magical Discoveries (spell choice), Peerless Skill
    //       (Bardic Inspiration rider on own checks).

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

    // =============================================== Rogue: Thief
    // "Climber. You gain a Climb Speed equal to your Speed." (Jumper has no category.)
    "Thief/Second-Story Work": [add("Movement", { movementType: "climb" })],
    // skip: Fast Hands, Supreme Sneak (Cunning Strike option), Use Magic Device, Thief's Reflexes.

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
    // AC 10 + Dex + Cha unarmored, and "Your Hit Point maximum increases by 3, and it increases by 1
    // whenever you gain another Sorcerer level" — +1/level equals the total exactly for single-class
    // sorcerers (3 at level 3, +1 each level after).
    "Draconic Sorcery/Draconic Resilience": [
        ac("10", "dex,cha"),
        add("HitPoints", { amount: "1", perLevel: "true" }),
    ],
    "Draconic Sorcery/Draconic Spells": spells(
        "Alter Self", "Chromatic Orb", "Command", "Dragon's Breath",
        "Fear", "Fly",
        "Arcane Eye", "Charm Monster",
        "Legend Lore", "Summon Dragon",
    ),
    // Dragon Wings is a 10-minute, once-per-Long-Rest flight (Fly Speed 60) — temporary, so only the
    // use is tracked; no Movement command (same precedent as Goliath Large Form's temporary +10 speed).
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

/*
 * Coverage-gap sweep (July 2026) — documented SKIPS (verified; no fitting category or
 * deliberately out of scope per the decision rules):
 *  - Path of the Berserker/Mindless Rage: "Immunity to the Charmed and Frightened conditions" — Immunities category takes damage types ONLY; condition immunity has no category. Matches existin
 *  - Circle of the Land/Nature's Ward: "immune to the Poisoned condition" is a condition (no category), and the "Resistance to a damage type associated with your current land choice" (Arid→
 *  - Oath of Devotion/Aura of Devotion: "You and your allies have Immunity to the Charmed condition" — Charmed is a condition, and Immunities category is damage types only (no category for c
 *  - Hunter/Defensive Tactics: Choice between two options, both of which impose Disadvantage on the ENEMY's attack rolls against you ("Opportunity Attacks have Disadvantage against 
 *  - Hunter/Superior Hunter's Defense: "take a Reaction to give yourself Resistance to that damage ... until the end of the current turn" — activated/temporary reaction whose damage type is
 *  - Draconic Sorcery/Elemental Affinity: "Choose one of those types: Acid, Cold, Fire, Lightning, or Poison. You have Resistance to that damage type" — resistance to a CHOSEN damage type; Res
 *  - Fiend Patron/Fiendish Resilience: "Choose one damage type, other than Force ... You have Resistance to that damage type until you choose a different one" — resistance to a CHOSEN (re-s
 */

import type { MadMap } from "../spec.ts";

/**
 * Curated MADS commands for SRD 5.2 (2024) species.
 * Keys are "<Species Name>/<Trait Name>", where the trait name is the **bold-run label** printed in
 * the Character Species section of 04_CharacterOrigins.md. Only effects the trait text LITERALLY
 * states are encoded. Per mads/apply.ts, AddStats/RemoveStats on a species trait is a hard lint error
 * (2024 species grant NO ability increases — those live on the background), so none appear here.
 *
 * Deliberately SKIPPED (choice-dependent, PB-scaling, or no catalog category can express them):
 *  - Trance, Halfling Nimbleness / Luck / Naturally Stealthy, Human Resourceful
 *    (Heroic Inspiration) / Versatile (origin feat of choice) — no category.
 *  - Goliath Giant Ancestry — the boon is a CHOICE from seven options (and its uses scale with PB).
 *  - Goliath Speed (35 ft) — a species Speed lives in the structured `speed` field, not a command.
 *  - Lineage spellcasting-ability picks (Int/Wis/Cha "choose when you select the lineage") — no category.
 *  - PB-SCALING limited uses (Uses needs a fixed `amount`, PB is not a constant): Dragonborn Breath
 *    Weapon, Dwarf Stonecunning, Orc Adrenaline Rush — "a number of times equal to your Proficiency
 *    Bonus". Left uncoded rather than pinned to a wrong fixed count. (Stonecunning's Tremorsense is
 *    also a 10-minute bonus-action effect — temporary, so no Senses command either.)
 *
 * Formerly skipped, now encoded:
 *  - Dragonborn Damage Resistance — choice-form Resistances over the Draconic Ancestors table's types.
 *  - Elven Lineage / Fiendish Legacy / Gnomish Lineage — branch GROUPS (group N + groupLabel): the
 *    player picks ONE branch on the sheet; level-3/5 lineage spells carry `level >=` prerequisites.
 */

/** Character-level gate for the lineage spells learned at levels 3 and 5. */
const atLevel = (keyValue: string) =>
    [{ value: "level", operation: ">=", keyValue, group: 0 }];

/** "You have Darkvision with a range of N feet." */
const darkvision = (range: string) =>
    ({ type: "Add", category: "Senses", value: { sense: "darkvision", range } } as const);

export const map: MadMap = {
    // Darkvision — fixed, always-on ranges stated per species.
    "Dragonborn/Darkvision": [darkvision("60")],
    "Dwarf/Darkvision": [darkvision("120")],
    "Elf/Darkvision": [darkvision("60")],
    "Gnome/Darkvision": [darkvision("60")],
    "Orc/Darkvision": [darkvision("120")],
    "Tiefling/Darkvision": [darkvision("60")],

    // Dwarf — "Your Hit Point maximum increases by 1, and it increases by 1 again whenever you gain a level."
    "Dwarf/Dwarven Toughness": [
        { type: "Add", category: "HitPoints", value: { amount: "1", perLevel: "true" } },
    ],

    // Dwarf — "You have Resistance to Poison damage. You also have Advantage on saving throws you make
    // to avoid or end the Poisoned condition."
    "Dwarf/Dwarven Resilience": [
        { type: "Add", category: "Resistances", value: { damageType: "Poison" } },
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "avoid or end the Poisoned condition" } },
    ],

    // Elf — "You have Advantage on saving throws you make to avoid or end the Charmed condition."
    "Elf/Fey Ancestry": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "avoid or end the Charmed condition" } },
    ],

    // Gnome — "You have Advantage on Intelligence, Wisdom, and Charisma saving throws."
    // One Advantage command per named ability (no condition in 2024 — the "against magic" qualifier is gone).
    "Gnome/Gnomish Cunning": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", stat: "int" } },
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", stat: "wis" } },
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", stat: "cha" } },
    ],

    // Halfling — "You have Advantage on saving throws you make to avoid or end the Frightened condition."
    "Halfling/Brave": [
        { type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", condition: "avoid or end the Frightened condition" } },
    ],

    // Orc — "Once you use this trait, you can't do so again until you finish a Long Rest."
    "Orc/Relentless Endurance": [
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Long Rest" } },
    ],

    // Dragonborn — "Once you use this trait, you can't use it again until you finish a Long Rest."
    "Dragonborn/Draconic Flight": [
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Long Rest" } },
    ],

    // Goliath — "Once you use this trait, you can't use it again until you finish a Long Rest."
    "Goliath/Large Form": [
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Long Rest" } },
    ],

    // Goliath — "You have Advantage on any ability check you make to end the Grappled condition."
    // (The "count as one size larger for carrying capacity" clause has no category.)
    "Goliath/Powerful Build": [
        { type: "Add", category: "Advantage", value: { rollType: "AbilityCheck", mode: "advantage", condition: "end the Grappled condition" } },
    ],

    // ================================================================
    // Coverage-gap sweep (July 2026): entries below were proposed and
    // adversarially verified against the parsed SRD text.
    // ================================================================
    // Grounding: "You can use this Breath Weapon a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long  [Uses equal to Proficiency Bonus]
    "Dragonborn/Breath Weapon": [
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Long Rest" } },
    ],
    // The granted Tremorsense is a 10-minute Bonus-Action temporary effect (rule 4: not an always-on Senses grant), so no Senses command. But there is a per [Uses equal to Proficiency Bonus]
    "Dwarf/Stonecunning": [
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Long Rest" } },
    ],
    // Grounding: "You have proficiency in the Insight, Perception, or Survival skill." This is a fixed three-option skill choice, which the Proficiencies ch
    "Elf/Keen Senses": [
        { type: "Add", category: "Proficiencies", value: { proficiency: "choice", options: "Insight,Perception,Survival", count: "1" } },
    ],
    // The lineage WRAPPER carries the branch groups so the player picks Forest OR Rock on the
    // sheet (the Forest Gnome/Rock Gnome trait rows stay narrative — grants here would apply to
    // every gnome unconditionally). Grounding: Forest "You know the *Minor Illusion* cantrip. You
    // also always have the *Speak with Animals* spell prepared." [PB uses/Long Rest]; Rock "You
    // know the *Mending* and *Prestidigitation* cantrips."
    "Gnome/Gnomish Lineage": [
        { type: "Add", category: "Spells", value: {}, target: "Minor Illusion", group: 1, groupLabel: "Forest Gnome" },
        { type: "Add", category: "Spells", value: {}, target: "Speak with Animals", group: 1, groupLabel: "Forest Gnome" },
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Long Rest" }, group: 1, groupLabel: "Forest Gnome" },
        { type: "Add", category: "Spells", value: {}, target: "Mending", group: 2, groupLabel: "Rock Gnome" },
        { type: "Add", category: "Spells", value: {}, target: "Prestidigitation", group: 2, groupLabel: "Rock Gnome" },
    ],
    // The chosen boon is one of seven options (teleport, damage riders, Prone, damage-reduction Reaction, etc.) — none encodable and all choice-dependent. B [Uses equal to Proficiency Bonus]
    "Goliath/Giant Ancestry": [
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Long Rest" } },
    ],
    // Grounding: "You gain proficiency in one skill of your choice." Proficiencies choice form over all 18 canonical skills, count 1 (rule 6). Existing race
    "Human/Skillful": [
        { type: "Add", category: "Proficiencies", value: { proficiency: "choice", options: "Acrobatics,Animal Handling,Arcana,Athletics,Deception,History,Insight,Intimidation,Investigation,Medicine,Nature,Perception,Performance,Persuasion,Religion,Sleight Of Hand,Stealth,Survival", count: "1" } },
    ],
    // Grounding: "You can use this trait a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Short or Long [Uses equal to Proficiency Bonus]
    "Orc/Adrenaline Rush": [
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Short Rest" } },
    ],
    // Grounding: "You know the Thaumaturgy cantrip." This is a fixed, non-choice cantrip grant (independent of which Fiendish Legacy is chosen — that only s
    "Tiefling/Otherworldly Presence": [
        { type: "Add", category: "Spells", value: {  }, target: "Thaumaturgy" },
    ],

    // ================================================================
    // Choice/branch encodings (July 2026): choice-form Resistances and
    // branch groups replaced the former documented skips below.
    // ================================================================

    // Grounding: "You have Resistance to the damage type determined by your Draconic Ancestry
    // trait." — the Draconic Ancestors table's distinct damage types, picked on the sheet.
    "Dragonborn/Damage Resistance": [
        { type: "Add", category: "Resistances", value: { damageType: "choice", options: "Acid,Cold,Fire,Lightning,Poison", count: "1" } },
    ],

    // Grounding: Elven Lineages table. One branch per lineage; the level-1 benefits are
    // unconditional within the branch, the level-3/5 spells are always-prepared and level-gated.
    // (The High Elf "replace the cantrip after a Long Rest" clause stays narrative.)
    "Elf/Elven Lineage": [
        { type: "Add", category: "Senses", value: { sense: "darkvision", range: "120" }, group: 1, groupLabel: "Drow" },
        { type: "Add", category: "Spells", value: {}, target: "Dancing Lights", group: 1, groupLabel: "Drow" },
        { type: "Add", category: "Spells", value: {}, target: "Faerie Fire", group: 1, groupLabel: "Drow", prerequisites: atLevel("3") },
        { type: "Add", category: "Spells", value: {}, target: "Darkness", group: 1, groupLabel: "Drow", prerequisites: atLevel("5") },
        { type: "Add", category: "Spells", value: {}, target: "Prestidigitation", group: 2, groupLabel: "High Elf" },
        { type: "Add", category: "Spells", value: {}, target: "Detect Magic", group: 2, groupLabel: "High Elf", prerequisites: atLevel("3") },
        { type: "Add", category: "Spells", value: {}, target: "Misty Step", group: 2, groupLabel: "High Elf", prerequisites: atLevel("5") },
        { type: "Add", category: "Speed", value: { speed: "35", mode: "set" }, group: 3, groupLabel: "Wood Elf" },
        { type: "Add", category: "Spells", value: {}, target: "Druidcraft", group: 3, groupLabel: "Wood Elf" },
        { type: "Add", category: "Spells", value: {}, target: "Longstrider", group: 3, groupLabel: "Wood Elf", prerequisites: atLevel("3") },
        { type: "Add", category: "Spells", value: {}, target: "Pass without Trace", group: 3, groupLabel: "Wood Elf", prerequisites: atLevel("5") },
    ],

    // Grounding: Fiendish Legacies table. One branch per legacy: a level-1 resistance + cantrip,
    // then always-prepared level-3/5 spells gated on character level.
    "Tiefling/Fiendish Legacy": [
        { type: "Add", category: "Resistances", value: { damageType: "Poison" }, group: 1, groupLabel: "Abyssal" },
        { type: "Add", category: "Spells", value: {}, target: "Poison Spray", group: 1, groupLabel: "Abyssal" },
        { type: "Add", category: "Spells", value: {}, target: "Ray of Sickness", group: 1, groupLabel: "Abyssal", prerequisites: atLevel("3") },
        { type: "Add", category: "Spells", value: {}, target: "Hold Person", group: 1, groupLabel: "Abyssal", prerequisites: atLevel("5") },
        { type: "Add", category: "Resistances", value: { damageType: "Necrotic" }, group: 2, groupLabel: "Chthonic" },
        { type: "Add", category: "Spells", value: {}, target: "Chill Touch", group: 2, groupLabel: "Chthonic" },
        { type: "Add", category: "Spells", value: {}, target: "False Life", group: 2, groupLabel: "Chthonic", prerequisites: atLevel("3") },
        { type: "Add", category: "Spells", value: {}, target: "Ray of Enfeeblement", group: 2, groupLabel: "Chthonic", prerequisites: atLevel("5") },
        { type: "Add", category: "Resistances", value: { damageType: "Fire" }, group: 3, groupLabel: "Infernal" },
        { type: "Add", category: "Spells", value: {}, target: "Fire Bolt", group: 3, groupLabel: "Infernal" },
        { type: "Add", category: "Spells", value: {}, target: "Hellish Rebuke", group: 3, groupLabel: "Infernal", prerequisites: atLevel("3") },
        { type: "Add", category: "Spells", value: {}, target: "Darkness", group: 3, groupLabel: "Infernal", prerequisites: atLevel("5") },
    ],
};

import type { MadMap } from "../spec.ts";

/**
 * Curated MADS commands for SRD 5.2 (2024) species.
 * Keys are "<Species Name>/<Trait Name>", where the trait name is the **bold-run label** printed in
 * the Character Species section of 04_CharacterOrigins.md. Only effects the trait text LITERALLY
 * states are encoded. Per mads/apply.ts, AddStats/RemoveStats on a species trait is a hard lint error
 * (2024 species grant NO ability increases — those live on the background), so none appear here.
 *
 * Deliberately SKIPPED (choice-dependent, PB-scaling, or no catalog category can express them):
 *  - Darkvision, Trance, Halfling Nimbleness / Luck / Naturally Stealthy, Human Resourceful
 *    (Heroic Inspiration) / Versatile (origin feat of choice) — no category.
 *  - Dragonborn Draconic Ancestry / Damage Resistance — the resisted type is CHOICE-dependent
 *    (picked from the Draconic Ancestors table), so no fixed Resistances command can be authored.
 *  - Tiefling Fiendish Legacy / Otherworldly Presence, Elf Elven Lineage, Gnome Gnomish Lineage
 *    (Forest/Rock Gnome) — the resistance/cantrip/spells depend on the legacy/lineage CHOICE.
 *  - Goliath Giant Ancestry — the boon is a CHOICE from seven options (and its uses scale with PB).
 *  - Human Skillful — "one skill of your choice"; Elf Keen Senses — "Insight, Perception, or
 *    Survival" (a CHOICE in 2024, unlike 5.1's fixed Perception) — no fixed Proficiencies command.
 *  - Goliath Speed (35 ft) — a species Speed lives in the structured `speed` field, not a command.
 *  - PB-SCALING limited uses (Uses needs a fixed `amount`, PB is not a constant): Dragonborn Breath
 *    Weapon, Dwarf Stonecunning, Orc Adrenaline Rush — "a number of times equal to your Proficiency
 *    Bonus". Left uncoded rather than pinned to a wrong fixed count.
 */
export const map: MadMap = {
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
};

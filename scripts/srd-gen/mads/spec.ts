/**
 * Declarative command specs for the curated MADS maps. Every spec is fed through the
 * client catalog's coerceCommand at generation time — a spec that fails coercion is a
 * HARD authoring error (reported, fails the run), never a silent drop.
 */
export interface CommandSpecInput {
    type: "Add" | "Remove";
    /** Catalog category, resolved via resolveCategory ("Uses", "ArmorClass", "Stats", ...). */
    category: string;
    /** Raw value fields per the catalog field specs (all strings). */
    value: Record<string, string>;
    /** For id-based categories (Spells/Items/Features/Feats): the referenced entity's exact name. */
    target?: string;
}

/**
 * Keys:
 *  - class features:      "Barbarian/Rage"           (level-agnostic feature name)
 *  - subclass features:   "Path of the Berserker/Frenzy"
 *  - race/subrace traits: "Dwarf/Dwarven Resilience"
 *  - background features: "Acolyte/Shelter of the Faithful"
 *  - feats:               "Grappler"                 (attaches to the feat's details)
 *  - magic items:         "Belt of Giant Strength"   (attaches to item.metadata.mads)
 */
export type MadMap = Record<string, CommandSpecInput[]>;

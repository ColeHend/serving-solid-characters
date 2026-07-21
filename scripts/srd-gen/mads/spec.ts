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
    /**
     * Mutually-exclusive branch number. Group 0 (default) always applies; commands sharing a nonzero
     * group form one branch, and the player picks exactly ONE branch on the sheet (e.g. an Elven
     * Lineage). Pair every nonzero group with a groupLabel so the picker can name the branch.
     */
    group?: number;
    /** Display name for this command's branch ("Drow", "Infernal"...). Stored as value.groupLabel. */
    groupLabel?: string;
    /**
     * Optional prerequisites stamped verbatim onto the coerced command. Evaluated at apply time
     * for Spells/Items only (checkPreReqs) — e.g. a character-level gate on a lineage spell:
     * { value: "level", operation: ">=", keyValue: "3", group: 0 }.
     */
    prerequisites?: { value: string; operation: string; keyValue: string; group: number }[];
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

/**
 * One curated feature option (an Eldritch Invocation, Pact Boon…). The player picks N options
 * on the sheet; a chosen option shows as a named feature and applies its mads. Mads run through
 * the same coerceCommand hard gate as CommandSpecInput maps.
 */
export interface OptionSpecInput {
    name: string;
    description: string;
    /** minLevel = level in the OWNING class; requiredFeature matches a feature OR chosen-option name; text is display-only. */
    prerequisite?: { minLevel?: number; requiredFeature?: string; text?: string };
    mads?: CommandSpecInput[];
}

/**
 * Curated option lists keyed like MadMap feature keys ("Warlock/Eldritch Invocations").
 * config needs count or countScaling ("level:count" pairs against the owning class's level).
 */
export type OptionsMap = Record<string, {
    config: { label?: string; count?: number; countScaling?: string };
    options: OptionSpecInput[];
}>;

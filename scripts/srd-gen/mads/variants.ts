import { nameKey } from "../lib/util.ts";
import type { MagicItemJson, Ruleset, RulesetData } from "../types.ts";

/**
 * Variant expansion: the SRD prints some items as ONE entry whose numeric effect varies by
 * rarity or sub-type ("Weapon, +1, +2, or +3"; Belt of Giant Strength's per-giant table).
 * A single combined entry can't carry one exact MADS command, so this pass replaces each
 * combined entry with its concrete variants BEFORE ids/mads run — every variant then gets a
 * stable id (minted per split name) and its own curated commands in magicItems.ts.
 *
 * Split ONLY when the variant table is the item's primary effect and the split yields
 * mads-representable defined data. Deliberately NOT split: Spell Scroll (per-level casting,
 * no command), Dragon Scale Mail / Ring of Elemental Command (the dragon/element variance is
 * a secondary rider on an already-annotated item), potions (consumable — no command anyway).
 *
 * Rarity strings are authored in 2024 title case; the 2014 files store rarities lowercase,
 * so expandMagicItemVariants lowercases them for that ruleset.
 */

interface VariantSpec {
    name: string;
    rarity: string;
}

const plusN = (family: string, rarities: [string, string, string]): VariantSpec[] =>
    ([1, 2, 3] as const).map(n => ({ name: `${family}, +${n}`, rarity: rarities[n - 1] }));

/** The ten Armor/Ring of Resistance damage types per the SRD tables. */
const RESISTANCE_TYPES = ["Acid", "Cold", "Fire", "Force", "Lightning", "Necrotic", "Poison", "Psychic", "Radiant", "Thunder"] as const;

const resistanceVariants = (family: string, rarity: string): VariantSpec[] =>
    RESISTANCE_TYPES.map(t => ({ name: `${family} (${t})`, rarity }));

/** Keyed by the combined entry's exact parsed name; present in BOTH rulesets unless noted. */
export const MAGIC_ITEM_VARIANTS: Record<string, VariantSpec[]> = {
    "Weapon, +1, +2, or +3": plusN("Weapon", ["Uncommon", "Rare", "Very Rare"]),
    "Ammunition, +1, +2, or +3": plusN("Ammunition", ["Uncommon", "Rare", "Very Rare"]),
    "Armor, +1, +2, or +3": plusN("Armor", ["Rare", "Very Rare", "Legendary"]),
    "Shield, +1, +2, or +3": plusN("Shield", ["Uncommon", "Rare", "Very Rare"]),
    "Wand of the War Mage, +1, +2, or +3": plusN("Wand of the War Mage", ["Uncommon", "Rare", "Very Rare"]),
    // Str score + rarity per the SRD "Belt of Giant Strength (type)" table.
    "Belt of Giant Strength": [
        { name: "Belt of Giant Strength (Hill)", rarity: "Rare" },
        { name: "Belt of Giant Strength (Stone)", rarity: "Very Rare" },
        { name: "Belt of Giant Strength (Frost)", rarity: "Very Rare" },
        { name: "Belt of Giant Strength (Fire)", rarity: "Very Rare" },
        { name: "Belt of Giant Strength (Cloud)", rarity: "Legendary" },
        { name: "Belt of Giant Strength (Storm)", rarity: "Legendary" },
    ],
    "Armor of Resistance": resistanceVariants("Armor of Resistance", "Rare"),
    "Ring of Resistance": resistanceVariants("Ring of Resistance", "Rare"),
};

export interface VariantReport {
    /** Number of variant items that replaced combined entries. */
    expanded: number;
    /** Variant keys that matched no parsed item — hard authoring errors. */
    errors: string[];
}

/** Replaces each combined magic item with its variants, in place. Run BEFORE assignIds. */
export function expandMagicItemVariants(ruleset: Ruleset, data: RulesetData): VariantReport {
    const report: VariantReport = { expanded: 0, errors: [] };
    const byKey = new Map(Object.entries(MAGIC_ITEM_VARIANTS).map(([k, v]) => [nameKey(k), v]));

    const seen = new Set<string>();
    const next: MagicItemJson[] = [];
    for (const item of data.magicItems) {
        const variants = byKey.get(nameKey(item.name));
        if (!variants) {
            next.push(item);
            continue;
        }
        seen.add(nameKey(item.name));
        for (const v of variants) {
            const clone = structuredClone(item);
            clone.id = ""; // new name → assignIds preserves/mints per variant name
            clone.name = v.name;
            clone.rarity = ruleset === "2014" ? v.rarity.toLowerCase() : v.rarity;
            next.push(clone);
            report.expanded++;
        }
    }

    for (const combined of Object.keys(MAGIC_ITEM_VARIANTS)) {
        if (!seen.has(nameKey(combined))) report.errors.push(`variants: combined item matched nothing: ${combined}`);
    }

    data.magicItems = next;
    return report;
}

import { homebrewManager } from "../../customHooks/homebrewManager";

/**
 * Class-name reference helpers shared by the dispatcher (canonicalize on save) and the readiness
 * broken-reference pass. Kept in its own module so both can import without a cycle (toolDispatcher and
 * deterministicPasses already each import homebrewManager).
 *
 * The canonicalization matters because consumers compare class names with an EXACT, case-sensitive
 * match (e.g. a subclass dropdown filters `subclass.parentClass === class.name`, and the spell picker
 * uses `spell.classes.includes(class.name)`). A model that emits "wizard" instead of "Wizard" would
 * save, dedupe (the storage key lowercases), and pass the case-insensitive reference check — yet be
 * unselectable on every character. Canonicalizing the stored value fixes that at the source.
 */

/** The standard 5e classes a subclass/spell can legitimately reference (both editions + Artificer). */
export const OFFICIAL_CLASSES = [
    "Artificer", "Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk",
    "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard",
];

export const norm = (s: string): string => s.trim().toLowerCase();

/** All class names a reference may resolve to: official + the user's homebrew classes (normalized). */
export function knownClassNames(): Set<string> {
    const names = new Set(OFFICIAL_CLASSES.map(norm));
    for (const c of homebrewManager.classes()) if (c?.name) names.add(norm(c.name));
    return names;
}

/** norm(name) → the class's real, correctly-cased stored name (official casing, or the homebrew's `name`). */
function canonicalClassMap(): Map<string, string> {
    const map = new Map<string, string>();
    for (const c of OFFICIAL_CLASSES) map.set(norm(c), c);
    // Homebrew classes win on a tie so a user's own casing/spelling is preserved.
    for (const c of homebrewManager.classes()) if (c?.name) map.set(norm(c.name), c.name);
    return map;
}

/**
 * Resolve a raw class name to its canonical stored form (so it satisfies consumers' exact `===`/`includes`
 * checks). Unknown names are returned trimmed/unchanged, so the readiness pass can still warn about them.
 */
export function canonicalClassName(raw: string): string {
    const trimmed = (raw ?? "").trim();
    if (!trimmed) return trimmed;
    return canonicalClassMap().get(norm(trimmed)) ?? trimmed;
}

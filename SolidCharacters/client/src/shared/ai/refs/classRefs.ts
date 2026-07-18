import { Class5E } from "../../../models/generated";
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

// --- parent-class ID resolution (mirrors raceRefs: lazy SRD catalog, homebrew-first find) ---

let srdClassesAcc: (() => Class5E[]) | null = null;
let catalogLoading: Promise<void> | null = null;

/**
 * Load the SRD class catalogs (both editions) once, fail-open. Await this before building a subclass
 * preview so a cold session doesn't spuriously miss the parent-class id.
 */
export function ensureClassCatalog(): Promise<void> {
    catalogLoading ??= (async () => {
        try {
            const mod = await import("../../customHooks/dndInfo/info/srd/classes");
            await Promise.all([mod.loadSrdClasses("2014"), mod.loadSrdClasses("2024")]);
            srdClassesAcc = mod.useGetSrdClasses("both");
        } catch {
            // Fail open: resolution degrades to homebrew classes only (name fallback covers the rest).
        }
    })();
    return catalogLoading;
}

function srdClasses(): Class5E[] {
    return srdClassesAcc ? srdClassesAcc() : [];
}

/**
 * Resolve a class NAME to its live Class5E row (homebrew first so a user's own class wins a name
 * tie, then SRD — 2024 row wins over 2014 in "both" since consumers prefer current). Undefined for
 * an unknown name; the caller falls back to name-based matching.
 */
export function findParentClass(name: string): Class5E | undefined {
    const n = norm(name ?? "");
    if (!n) return undefined;
    const byName = (arr: Class5E[]): Class5E | undefined => arr.find(c => norm(c?.name ?? "") === n);
    return byName(homebrewManager.classes()) ?? byName(srdClasses().filter(c => c.legacy === false)) ?? byName(srdClasses());
}

import { homebrewManager } from "../customHooks/homebrewManager";
import { loadSrdFeats, srdFeatsSnapshot } from "../customHooks/dndInfo/info/srd/feats";
import { norm } from "./classRefs";

/**
 * Feat-name reference helpers for the 2024-background granted-feat readiness check. A 2024 background's
 * `feat` is a free-text name resolved by the character build against SRD + homebrew feats; a name that
 * matches nothing yields a feature with an empty description. We resolve the same way the consumer does.
 *
 * Fails open: if the SRD feats aren't loaded yet, the check is skipped (see srdFeatsReady) rather than
 * false-warning on a real official feat the snapshot just doesn't have in memory.
 */

let loadKicked = false;
function ensureSrdFeatsLoaded(): void {
    if (loadKicked) return;
    loadKicked = true;
    void loadSrdFeats("2014");
    void loadSrdFeats("2024");
}

/** True once SRD feats are in memory — the reference check only runs when we have an authoritative set. */
export function srdFeatsReady(): boolean {
    ensureSrdFeatsLoaded();
    return srdFeatsSnapshot().length > 0;
}

/** All feat names a 2024 background's `feat` may resolve to: SRD (both editions) + homebrew, normalized. */
export function knownFeatNames(): Set<string> {
    ensureSrdFeatsLoaded();
    const names = new Set<string>();
    const add = (n: unknown) => { if (typeof n === "string" && n.trim()) names.add(norm(n)); };
    for (const f of srdFeatsSnapshot()) add(f?.details?.name ?? (f as { name?: string })?.name);
    for (const f of homebrewManager.feats()) add(f?.details?.name ?? f?.name);
    return names;
}

/**
 * Resolve a granted-feat name the way the character build's getFeature does: case-insensitive, with the
 * "Magic Initiate (Cleric)" → "Magic Initiate" collapse the consumer applies.
 */
export function featResolves(name: string, known: Set<string> = knownFeatNames()): boolean {
    const n = norm(name);
    if (!n) return false;
    if (n.includes("magic initiate")) return true;
    return known.has(n);
}

import { Race } from "../../../models/generated";
import { homebrewManager } from "../../customHooks/homebrewManager";

/**
 * Race reference helpers for the subrace tools. A stored Subrace points at its parent by the RACE'S ID
 * (every consumer filters `subrace.parentRace === race.id`), but the model names the parent — so the
 * dispatcher needs name → Race resolution, and the preview card needs id → name back.
 *
 * SRD races are reached through a LAZY dynamic import (mirrors commandAgent's ensureCatalogs): the
 * aiAssistant singleton imports toolDispatcher → this module, and a static import here would eagerly
 * drag the dnd-info/SRD graph (Dexie tables) into every consumer and break partially-mocked tests.
 * `ensureRaceCatalog()` is awaited by the orchestrator before any subrace preview builds; the resolvers
 * themselves stay synchronous and fall back to homebrew-only until it has run.
 */

let srdRacesAcc: (() => Race[]) | null = null;
let catalogLoading: Promise<void> | null = null;

/**
 * Load the SRD race catalogs (both editions) once, fail-open. Await this before building a subrace
 * preview so a cold session doesn't spuriously fail the parent-race lookup.
 */
export function ensureRaceCatalog(): Promise<void> {
    catalogLoading ??= (async () => {
        try {
            const mod = await import("../../customHooks/dndInfo/info/srd/races");
            await Promise.all([mod.loadSrdRaces("2014"), mod.loadSrdRaces("2024")]);
            srdRacesAcc = mod.useGetSrdRaces("both");
        } catch {
            // Fail open: resolution degrades to homebrew races only.
        }
    })();
    return catalogLoading;
}

function srdRaces(): Race[] {
    return srdRacesAcc ? srdRacesAcc() : [];
}

const norm = (s: string): string => s.trim().toLowerCase();

/**
 * Resolve a race NAME to its live Race row (homebrew first so a user's own race wins a name tie,
 * then SRD, both editions). Returns undefined for an unknown name.
 */
export function findParentRace(name: string): Race | undefined {
    const n = norm(name ?? "");
    if (!n) return undefined;
    const byName = (arr: Race[]): Race | undefined => arr.find(r => norm(r?.name ?? "") === n);
    return byName(homebrewManager.races()) ?? byName(srdRaces());
}

/** The stored name of the race with this id, or undefined if no loaded race matches. */
export function raceNameById(id: string): string | undefined {
    if (!id) return undefined;
    const byId = (arr: Race[]): Race | undefined => arr.find(r => r?.id === id);
    return (byId(homebrewManager.races()) ?? byId(srdRaces()))?.name;
}

/** Every known race name (homebrew + loaded SRD), deduped — for "did you mean…" hints. */
export function knownRaceNames(): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const r of [...homebrewManager.races(), ...srdRaces()]) {
        const name = (r?.name ?? "").trim();
        if (name && !seen.has(norm(name))) { seen.add(norm(name)); out.push(name); }
    }
    return out;
}

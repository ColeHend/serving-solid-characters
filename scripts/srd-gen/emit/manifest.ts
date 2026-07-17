import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Ruleset } from "../types.ts";

/**
 * SRD data manifest: a content-derived version the client compares against its cached copy.
 * Hashes are computed over the EXACT serialization writeFiles emits, so any change to the
 * written data (including a no-op regen ordering change) bumps the version, and identical
 * regens are hash-stable.
 */

export interface RulesetManifestEntry {
    hash: string;
    counts: Record<string, number>;
    generatedAt: string;
}

export interface SrdManifest {
    version: string;
    generatedAt: string;
    rulesets: Partial<Record<Ruleset, RulesetManifestEntry>>;
}

const sha256 = (s: string) => crypto.createHash("sha256").update(s, "utf8").digest("hex");

/** Hash one output file's rows using the same serialization writeFiles uses. */
export function fileHash(rows: unknown[]): string {
    return sha256(JSON.stringify(rows, null, 1) + "\n");
}

/** Deterministic hash of a whole ruleset's file plan (sorted by file name). */
export function rulesetHash(plan: Record<string, unknown[]>): string {
    const parts = Object.keys(plan)
        .sort()
        .map(name => `${name}:${fileHash(plan[name])}`);
    return sha256(parts.join("|"));
}

/**
 * Merge this run's per-ruleset entries into the existing manifest (so a single-ruleset run
 * doesn't clobber the other ruleset's hash) and recompute the top-level version from all
 * known ruleset hashes. Returns the path written.
 */
export function writeManifest(dataRoot: string, entries: Partial<Record<Ruleset, RulesetManifestEntry>>): string {
    const manifestPath = path.join(dataRoot, "manifest.json");
    let existing: SrdManifest | undefined;
    if (fs.existsSync(manifestPath)) {
        try {
            existing = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as SrdManifest;
        } catch {
            existing = undefined; // corrupt manifest: rebuild from this run
        }
    }
    const rulesets: SrdManifest["rulesets"] = { ...existing?.rulesets, ...entries };
    const version = sha256(
        Object.keys(rulesets)
            .sort()
            .map(r => `${r}:${rulesets[r as Ruleset]!.hash}`)
            .join("|"),
    );
    const manifest: SrdManifest = { version, generatedAt: new Date().toISOString(), rulesets };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1) + "\n", "utf8");
    return manifestPath;
}

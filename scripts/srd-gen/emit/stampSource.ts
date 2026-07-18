import type { Ruleset, RulesetData } from "../types.ts";

/** Provenance label per ruleset. Shared with validateSource so stamp + gate can't drift. */
export const SOURCE: Record<Ruleset, string> = { "2014": "SRD 5.1", "2024": "SRD 5.2" };

/**
 * Central pass: stamp `source` on every top-level entity (2014 → "SRD 5.1", 2024 → "SRD 5.2").
 * Parsers must NOT emit source — this pass owns it, same ownership model as ids/mads/legacy.
 * Only top-level rows are stamped; nested features/traits are not.
 */
export function stampSource(ruleset: Ruleset, data: RulesetData): void {
    const source = SOURCE[ruleset];
    for (const rows of Object.values(data)) {
        if (!Array.isArray(rows)) continue;
        for (const row of rows) {
            if (row && typeof row === "object") (row as { source?: string }).source = source;
        }
    }
}

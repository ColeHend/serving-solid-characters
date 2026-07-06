import type { Ruleset, RulesetData } from "../types.ts";

/**
 * Central pass: stamp `legacy` on every top-level entity (2014 → true, 2024 → false).
 * Parsers must NOT emit legacy — this pass owns it, same ownership model as ids/mads.
 * Only top-level rows are stamped; nested features/traits are not.
 */
export function stampLegacy(ruleset: Ruleset, data: RulesetData): void {
    const legacy = ruleset === "2014";
    for (const rows of Object.values(data)) {
        if (!Array.isArray(rows)) continue;
        for (const row of rows) {
            if (row && typeof row === "object") (row as { legacy?: boolean }).legacy = legacy;
        }
    }
}

import type { RuleJson } from "../../types.ts";
import { RULES_2014 } from "./rulesData.ts";

/**
 * 2014 rules dictionary — a curated hand-authored set (see rulesData.ts). Returns a fresh
 * clone each call so the central id-stability / legacy-stamp passes mutate a copy, not the
 * shared module constant.
 */
export function parseRules2014(): RuleJson[] {
    return structuredClone(RULES_2014);
}

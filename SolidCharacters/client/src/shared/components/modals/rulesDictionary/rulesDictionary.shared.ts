import { Rule } from "../../../../models/generated";

/** A user-authored rule. Same shape as an SRD `Rule` plus create/update stamps. Stored in its
 *  own Dexie DB (dnd_userRules), keyed by `id`, and merged into the dictionary alongside SRD rules. */
export type UserRule = Rule & { createdAt: number; updatedAt: number };

/** A "starred" marker. `ruleId` references an SRD `Rule.id` OR a custom rule id — both are stable. */
export type RuleFavorite = { ruleId: string; createdAt: number };

/** Which edition(s) of SRD rules the dictionary is currently showing. */
export type RuleEdition = "2014" | "2024" | "both";

/** Case-insensitive substring match over a rule's searchable text (name + description + category +
 *  tags), mirroring the AI lookup tool's `matchRows`. An empty query matches everything. */
export function matchRule(rule: Rule, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    rule.name,
    rule.description,
    rule.category ?? "",
    ...(rule.tags ?? []),
  ].join(" ").toLowerCase();
  return haystack.includes(q);
}

/** Merge SRD + custom rules, de-duped by `id` (a custom rule with a colliding id wins). */
export function mergeRules(srd: Rule[], custom: UserRule[]): Rule[] {
  return [...new Map([...srd, ...custom].map((r) => [r.id, r])).values()];
}

/** Favorites float to the top; within each group, sort alphabetically by name (case-insensitive). */
export function sortRules(rules: Rule[], favoriteIds: Set<string>): Rule[] {
  return [...rules].sort((a, b) => {
    const aFav = favoriteIds.has(a.id) ? 0 : 1;
    const bFav = favoriteIds.has(b.id) ? 0 : 1;
    if (aFav !== bFav) return aFav - bFav;
    return (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" });
  });
}

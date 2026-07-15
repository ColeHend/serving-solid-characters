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

/** Alphabetical by name (case-insensitive). Starred rules sort inline — the index shows the star
 *  in place and the "Starred" filter covers finding them. */
export function sortRules(rules: Rule[]): Rule[] {
  return [...rules].sort((a, b) =>
    (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" }),
  );
}

/** Which edition badge a rule shows. SRD rules are centrally stamped (2014 → legacy:true,
 *  2024 → legacy:false); `undefined` means unknown, so no badge rather than a guessed one. */
export function editionBadge(rule: Rule): "2014" | "2024" | undefined {
  return rule.legacy === true ? "2014" : rule.legacy === false ? "2024" : undefined;
}

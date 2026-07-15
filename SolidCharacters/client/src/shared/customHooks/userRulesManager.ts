import { Accessor, createSignal } from "solid-js";
import userRulesDB from "./utility/localDB/userRulesDB";
import { createNewId } from "./utility/tools/idGen";
import type { UserRule } from "../components/modals/rulesDictionary/rulesDictionary.shared";

/**
 * Singleton store for the rules dictionary's user data (custom rules + starred ids), mirroring
 * reviewAgentManager. The signals are the single source of truth the UI subscribes to; every
 * mutator writes to IndexedDB then updates the signal, so a page reload rehydrates the same state.
 */
const [customRules, setCustomRules] = createSignal<UserRule[]>([]);
const [favoriteIds, setFavoriteIds] = createSignal<Set<string>>(new Set());

/** Reactive list of user-authored rules (most-recently-updated first). */
export const userCustomRules: Accessor<UserRule[]> = customRules;
/** Reactive set of starred rule ids (SRD or custom). */
export const starredRuleIds: Accessor<Set<string>> = favoriteIds;

let loaded = false;
let loading: Promise<void> | null = null;

/** Load custom rules + favorites from IndexedDB once (idempotent); concurrent callers share the promise. */
export function ensureUserRulesLoaded(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (loading) return loading;
  loading = Promise.all([
    userRulesDB.rules.orderBy("updatedAt").reverse().toArray(),
    userRulesDB.favorites.toArray(),
  ])
    .then(([rules, favs]) => {
      setCustomRules(rules);
      setFavoriteIds(new Set(favs.map((f) => f.ruleId)));
      loaded = true;
    })
    .catch((e) => { console.error("Failed to load user rules", e); })
    .finally(() => { loading = null; });
  return loading;
}

/** Refresh the custom-rules signal from IndexedDB. */
async function reloadCustomRules(): Promise<void> {
  try {
    setCustomRules(await userRulesDB.rules.orderBy("updatedAt").reverse().toArray());
  } catch (e) {
    console.error("Failed to reload user rules", e);
  }
}

/** Create or update a custom rule (id assigned if absent). Returns the persisted record. */
export async function saveCustomRule(
  input: Partial<UserRule> & Pick<UserRule, "name" | "description">,
): Promise<UserRule> {
  const now = Date.now();
  const rule: UserRule = {
    ...input,
    id: input.id || createNewId(),
    name: input.name,
    description: input.description,
    tags: input.tags ?? [],
    legacy: input.legacy ?? false,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };
  await userRulesDB.rules.put(rule);
  await reloadCustomRules();
  return rule;
}

/** Delete a custom rule and any star it carried. */
export async function deleteCustomRule(id: string): Promise<void> {
  try {
    await userRulesDB.rules.delete(id);
    await userRulesDB.favorites.delete(id);
  } catch (e) {
    console.error("Failed to delete user rule", e);
  }
  setFavoriteIds((prev) => {
    if (!prev.has(id)) return prev;
    const next = new Set(prev);
    next.delete(id);
    return next;
  });
  await reloadCustomRules();
}

/** Toggle the starred state of a rule id (SRD or custom). Optimistic; rolls back on failure. */
export async function toggleFavorite(ruleId: string): Promise<void> {
  const isFav = favoriteIds().has(ruleId);
  setFavoriteIds((prev) => {
    const next = new Set(prev);
    if (isFav) next.delete(ruleId);
    else next.add(ruleId);
    return next;
  });
  try {
    if (isFav) await userRulesDB.favorites.delete(ruleId);
    else await userRulesDB.favorites.put({ ruleId, createdAt: Date.now() });
  } catch (e) {
    console.error("Failed to toggle rule favorite", e);
    // Roll back the optimistic change.
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.add(ruleId);
      else next.delete(ruleId);
      return next;
    });
  }
}

import { describe, it, expect, beforeEach } from "vitest";
import userRulesDB from "../utility/localDB/userRulesDB";
import {
  saveCustomRule,
  deleteCustomRule,
  toggleFavorite,
  userCustomRules,
  starredRuleIds,
} from "../userRulesManager";

describe("userRulesManager (fake-indexeddb)", () => {
  beforeEach(async () => {
    await userRulesDB.rules.clear();
    await userRulesDB.favorites.clear();
  });

  it("saveCustomRule persists a new rule and reflects it in the signal", async () => {
    const saved = await saveCustomRule({ name: "Flanking", description: "You get advantage.", category: "Combat" });
    expect(saved.id).toBeTruthy();
    expect(saved.tags).toEqual([]);
    expect(saved.createdAt).toBeGreaterThan(0);

    const row = await userRulesDB.rules.get(saved.id);
    expect(row?.name).toBe("Flanking");
    expect(userCustomRules().some((r) => r.id === saved.id)).toBe(true);
  });

  it("saveCustomRule edits in place when the id is reused", async () => {
    const created = await saveCustomRule({ name: "Old", description: "desc" });
    const edited = await saveCustomRule({ id: created.id, createdAt: created.createdAt, name: "New", description: "desc2" });

    expect(edited.id).toBe(created.id);
    expect(await userRulesDB.rules.count()).toBe(1);
    const row = await userRulesDB.rules.get(created.id);
    expect(row?.name).toBe("New");
    expect(row?.description).toBe("desc2");
  });

  it("toggleFavorite stars then unstars a rule id (SRD or custom)", async () => {
    const id = "srd-rule-123";
    await toggleFavorite(id);
    expect(starredRuleIds().has(id)).toBe(true);
    expect(await userRulesDB.favorites.get(id)).toBeTruthy();

    await toggleFavorite(id);
    expect(starredRuleIds().has(id)).toBe(false);
    expect(await userRulesDB.favorites.get(id)).toBeUndefined();
  });

  it("deleteCustomRule removes the rule and its star", async () => {
    const created = await saveCustomRule({ name: "Doomed", description: "gone soon" });
    await toggleFavorite(created.id);
    expect(starredRuleIds().has(created.id)).toBe(true);

    await deleteCustomRule(created.id);
    expect(await userRulesDB.rules.get(created.id)).toBeUndefined();
    expect(await userRulesDB.favorites.get(created.id)).toBeUndefined();
    expect(starredRuleIds().has(created.id)).toBe(false);
    expect(userCustomRules().some((r) => r.id === created.id)).toBe(false);
  });
});

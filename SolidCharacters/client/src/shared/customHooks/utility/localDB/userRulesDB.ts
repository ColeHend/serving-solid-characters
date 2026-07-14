import Dexie from "dexie";
import type { UserRule, RuleFavorite } from "../../../components/modals/rulesDictionary/rulesDictionary.shared";

/**
 * User-owned rules-dictionary data: custom rules the user authored, plus which rules (SRD or custom)
 * they've starred. Kept in its OWN Dexie database (mirroring reviewAgentDB / chatHistoryDB) rather
 * than the shared SRD `LocalDB` — that store is bulk-overwritten from the API — or `UserSettings`,
 * which is Clone()d on every settings keystroke.
 */
class UserRulesDB extends Dexie {
  /** Custom rules, keyed by `id`; `updatedAt` indexed for most-recent-first ordering. */
  rules!: Dexie.Table<UserRule, string>;
  /** Starred rule ids (SRD or custom), keyed by `ruleId`. */
  favorites!: Dexie.Table<RuleFavorite, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      rules: "id, updatedAt",
      favorites: "ruleId",
    });
  }
}

const userRulesDB = new UserRulesDB("dnd_userRules");

export default userRulesDB;

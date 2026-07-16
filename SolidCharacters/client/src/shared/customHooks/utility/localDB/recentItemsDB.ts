import Dexie from "dexie";

export type RecentItemType =
  | "spell"
  | "class"
  | "subclass"
  | "race"
  | "subrace"
  | "feat"
  | "background"
  | "item"
  | "tool";

/** A recently-viewed entity or tool, shown in the nav drawer's RECENT section. */
export interface RecentItem {
  /** Stable key: `${type}:${name.toLowerCase()}` so revisits update-in-place. */
  id: string;
  name: string;
  type: RecentItemType;
  /** Where clicking the recent row navigates, e.g. "/info/spells?name=Fireball". */
  route: string;
  visitedAt: number;
}

class RecentItemsDB extends Dexie {
  items!: Dexie.Table<RecentItem, string>;

  constructor(name: string) {
    super(name);
    // `visitedAt` is indexed so queries can orderBy("visitedAt").reverse().
    this.version(1).stores({ items: "id, visitedAt" });
  }
}

const recentItemsDB = new RecentItemsDB("dnd_recentItems");

export default recentItemsDB;

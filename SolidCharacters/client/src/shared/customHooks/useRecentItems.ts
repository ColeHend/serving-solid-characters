import { Accessor, createSignal } from "solid-js";
import recentItemsDB, {
  RecentItem,
  RecentItemType,
} from "./utility/localDB/recentItemsDB";

/** How many recent items are kept in Dexie; the nav menu only shows the top 3. */
const KEEP = 20;

const [recent, setRecent] = createSignal<RecentItem[]>([]);

export const recentItems: Accessor<RecentItem[]> = recent;

export const recentTop3 = (): RecentItem[] => recent().slice(0, 3);

/** Re-reads the store newest-first into the module signal. Called on load and on drawer open. */
export async function refreshRecent(): Promise<void> {
  try {
    const rows = await recentItemsDB.items
      .orderBy("visitedAt")
      .reverse()
      .toArray();
    setRecent(rows);
  } catch {
    // Recent items are cosmetic — never let a Dexie failure surface.
  }
}

export interface TrackRecentInput {
  name: string;
  type: RecentItemType;
  route: string;
}

/**
 * Records a visit to an entity detail view or tool page. Fire-and-forget:
 * callers must never block or crash a detail view on this.
 */
export async function trackRecentItem(item: TrackRecentInput): Promise<void> {
  try {
    const row: RecentItem = {
      id: `${item.type}:${item.name.toLowerCase()}`,
      name: item.name,
      type: item.type,
      route: item.route,
      visitedAt: Date.now(),
    };
    await recentItemsDB.items.put(row);

    const rows = await recentItemsDB.items
      .orderBy("visitedAt")
      .reverse()
      .toArray();
    const overflow = rows.slice(KEEP).map((r) => r.id);
    if (overflow.length > 0) await recentItemsDB.items.bulkDelete(overflow);
    setRecent(rows.slice(0, KEEP));
  } catch {
    // Recent items are cosmetic — never let a Dexie failure surface.
  }
}

refreshRecent();

import { createSignal } from "solid-js";
import { addSnackbar } from "coles-solid-library";
import { refreshAllSrdTables } from "../../shared/customHooks/dndInfo/info/srd/loadSrdTable";
import SrdDB from "../../shared/customHooks/utility/localDB/new/srdDB";
import SrdDB2024 from "../../shared/customHooks/utility/localDB/new/srdDB2024";

/**
 * SRD data freshness: compares the server's content-derived manifest version
 * (GET /api/srd/manifest, emitted by scripts/srd-gen) against the version this client last
 * pulled. When they differ, the navbar shows an "Update SRD data" button whose click re-pulls
 * every SRD dataset into IndexedDB.
 *
 * The manifest route lives OUTSIDE the service worker's /api/(2014|2024|DndInfo) SWR cache on
 * purpose — a freshness probe served from cache would defeat itself — and is fetched no-store.
 */

const DATA_VERSION_KEY = "srd:dataVersion";

/** True when the server has newer SRD data than this client's cache. Drives the nav button. */
export const [srdUpdateAvailable, setSrdUpdateAvailable] = createSignal(false);
/** True while an update pull is running (disables the nav button). */
export const [srdUpdating, setSrdUpdating] = createSignal(false);

function readStoredVersion(): string | null {
  try { return localStorage.getItem(DATA_VERSION_KEY); } catch { return null; }
}

function writeStoredVersion(version: string) {
  try { localStorage.setItem(DATA_VERSION_KEY, version); } catch { /* ignore */ }
}

async function fetchServerVersion(): Promise<string | undefined> {
  const res = await fetch("/api/srd/manifest", { cache: "no-store" });
  if (!res.ok) return undefined;
  const manifest = (await res.json()) as { version?: string };
  return manifest?.version || undefined;
}

/** Cheap probe: does this client have any SRD data cached at all? */
async function hasAnySrdCached(): Promise<boolean> {
  try {
    return (await SrdDB.classes.count()) > 0 || (await SrdDB2024.classes.count()) > 0;
  } catch {
    return false;
  }
}

/**
 * One lightweight call on connect: fetch the manifest and flag whether cached data is stale.
 * A client with cached data but no stored version (cache predates versioning) is offered the
 * update; a client with nothing cached silently adopts the current version — its first seed
 * will pull current data anyway.
 */
export async function checkSrdFreshness(): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  try {
    const serverVersion = await fetchServerVersion();
    if (!serverVersion) return; // no manifest available — nothing to compare against
    const stored = readStoredVersion();
    if (!stored) {
      if (await hasAnySrdCached()) setSrdUpdateAvailable(true);
      else writeStoredVersion(serverVersion);
      return;
    }
    setSrdUpdateAvailable(stored !== serverVersion);
  } catch {
    // Offline or server hiccup — leave the flag as-is and try again on the next connect.
  }
}

/**
 * Record the current server version as "what we have" — called after a verified-successful
 * full offline preload, so freshly seeded clients aren't immediately prompted to update.
 */
export async function adoptCurrentSrdVersion(): Promise<void> {
  try {
    const serverVersion = await fetchServerVersion();
    if (serverVersion) {
      writeStoredVersion(serverVersion);
      setSrdUpdateAvailable(false);
    }
  } catch { /* ignore — adoption is best-effort */ }
}

/**
 * Pull fresh SRD data for every dataset, replacing IndexedDB + in-memory signals, then record
 * the new version and drop the service worker's api-srd cache (both its stale copies and the
 * cache-busted junk entries the refresh added). Partial failure keeps the button visible so the
 * user can retry; cached data is only replaced per-dataset after its fetch succeeds.
 */
export async function updateSrdData(): Promise<boolean> {
  if (srdUpdating()) return false;
  setSrdUpdating(true);
  try {
    const results = await refreshAllSrdTables();
    if (results.some(r => !r.ok)) throw new Error("partial SRD refresh failure");
    if (typeof caches !== "undefined") {
      await caches.delete("api-srd").catch(() => false);
    }
    const serverVersion = await fetchServerVersion();
    if (serverVersion) writeStoredVersion(serverVersion);
    setSrdUpdateAvailable(false);
    addSnackbar({ message: "SRD data updated", severity: "success" });
    return true;
  } catch (e) {
    console.error("SRD data update failed", e);
    addSnackbar({ message: "Could not update SRD data — try again", severity: "error" });
    return false;
  } finally {
    setSrdUpdating(false);
  }
}

import type { SrdVersion } from "./preloadSrd";
import SrdDB from "../../shared/customHooks/utility/localDB/new/srdDB";
import SrdDB2024 from "../../shared/customHooks/utility/localDB/new/srdDB2024";
import { OCR_ASSET_URLS, OCR_CACHE_NAME } from "./ocrAssets";

/**
 * Confirms the app is ACTUALLY usable offline rather than trusting that a download "succeeded".
 * The preload only reports API-fetch results; this verifies the data really landed in IndexedDB,
 * the app shell is in the Workbox precache, and the service worker is active and controlling. Used
 * to gate the "available offline" claim (preloadSrd.ts), to drive the status panel
 * (OfflineStatus.tsx), and to self-heal after eviction (install.ts).
 */

export interface TableCheck {
  db: "dnd_srd" | "dnd_srd_2024";
  table: string;
  version: SrdVersion | "shared";
  label: string;
  count: number;
  ok: boolean;
}

export interface OfflineReadyReport {
  /** Overall: data + precache + service worker all OK. OCR is reported but does NOT gate this. */
  ready: boolean;
  data: { ok: boolean; checks: TableCheck[]; missing: string[] };
  precache: { ok: boolean; cacheName?: string; entryCount: number };
  serviceWorker: { controlling: boolean; activated: boolean };
  /** Secondary: self-hosted OCR assets cached. Informational only (offline OCR is a nice-to-have). */
  ocr: { ok: boolean; cached: number; total: number };
}

// Datasets loaded per ruleset version (mirrors buildTasks in preloadSrd.ts). The matching Dexie DB
// is chosen by version below; magicItems/weaponMasteries are version-agnostic and live in fixed DBs.
const PER_VERSION_TABLES = [
  "spells",
  "classes",
  "races",
  "subraces",
  "feats",
  "backgrounds",
  "items",
  "subclasses",
  "monsters",
  "rules",
] as const;

const MIN_PRECACHE_ENTRIES = 20; // keep in sync with scripts/pwa-smoke.mjs

// --- Non-empty snapshot ------------------------------------------------------------------
// A row count of 0 is ambiguous: it can mean "loaded, legitimately empty" (e.g. /api/2024/Subraces
// returns []) or "evicted / never downloaded". Resolve it by recording, on a successful download,
// which datasets came back NON-EMPTY, then only requiring count>0 for those. Stored here (not in
// preloadSrd) so preloadSrd's existing one-way import into this module is preserved.
const SNAPSHOT_KEY = "srdPreload:nonEmpty";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const APP_VERSION = (import.meta as any).env?.VITE_APP_VERSION || "dev";

/** Persist the set of dataset labels that loaded with rows (version-keyed, so a deploy re-derives). */
export function writeNonEmptySnapshot(labels: string[]): void {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ v: APP_VERSION, labels }));
  } catch {
    /* ignore */
  }
}

/** Read the non-empty snapshot for this app version, or null if absent/stale/unparsable. */
export function readNonEmptySnapshot(): string[] | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v?: string; labels?: string[] };
    if (parsed?.v !== APP_VERSION || !Array.isArray(parsed.labels)) return null;
    return parsed.labels;
  } catch {
    return null;
  }
}

/**
 * A dataset is "available offline" if it has rows, OR the snapshot proves it was loaded but is
 * legitimately empty. Without a snapshot we fall back to strict count>0 (conservative; self-corrects
 * on the next online download). A previously non-empty dataset dropping to 0 is treated as missing
 * (eviction detection).
 */
export function isDatasetOk(count: number, label: string, snapshot: string[] | null): boolean {
  if (count > 0) return true;
  if (snapshot === null) return false;
  return !snapshot.includes(label); // not in the non-empty set ⇒ known-empty ⇒ ok
}

function dbForVersion(v: SrdVersion) {
  return v === "2024" ? SrdDB2024 : SrdDB;
}

async function countDataset(
  db: typeof SrdDB,
  table: string,
  version: SrdVersion | "shared",
  label: string,
): Promise<Omit<TableCheck, "ok">> {
  const dbName = (db as unknown as { name: string }).name as "dnd_srd" | "dnd_srd_2024";
  try {
    await db.initPromise;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const count = await (db as any)[table].count();
    return { db: dbName, table, version, label, count };
  } catch (e) {
    console.warn(`[verify] count failed for ${label}`, e);
    return { db: dbName, table, version, label, count: 0 };
  }
}

async function checkData(versions: SrdVersion[]): Promise<OfflineReadyReport["data"]> {
  const tasks: Promise<Omit<TableCheck, "ok">>[] = [];
  for (const v of versions) {
    const db = dbForVersion(v);
    for (const t of PER_VERSION_TABLES) tasks.push(countDataset(db, t, v, `${v} ${t}`));
  }
  // Magic items are a version-agnostic 2024 dataset always loaded into the 2024 DB.
  tasks.push(countDataset(SrdDB2024, "magicItems", "shared", "magic items"));
  // Weapon masteries are 2024-only AND (unusually) stored in the 2014 DB — mirror the loader.
  if (versions.includes("2024")) tasks.push(countDataset(SrdDB, "weaponMasteries", "shared", "masteries"));

  const snapshot = readNonEmptySnapshot();
  const checks: TableCheck[] = (await Promise.all(tasks)).map((c) => ({
    ...c,
    ok: isDatasetOk(c.count, c.label, snapshot),
  }));
  const missing = checks.filter((c) => !c.ok).map((c) => c.label);
  return { ok: missing.length === 0, checks, missing };
}

async function checkPrecache(): Promise<OfflineReadyReport["precache"]> {
  if (typeof caches === "undefined") return { ok: false, entryCount: 0 };
  try {
    const names = await caches.keys();
    const cacheName = names.find((n) => /workbox-precache/i.test(n));
    if (!cacheName) return { ok: false, entryCount: 0 };
    const cache = await caches.open(cacheName);
    const entryCount = (await cache.keys()).length;
    // A populated workbox precache means the shell is cached. (We avoid an explicit
    // caches.match('/index.html') gate — its hashed ?__WB_REVISION__ key makes it a flaky signal.)
    return { ok: entryCount >= MIN_PRECACHE_ENTRIES, cacheName, entryCount };
  } catch (e) {
    console.warn("[verify] precache check failed", e);
    return { ok: false, entryCount: 0 };
  }
}

async function checkServiceWorker(): Promise<OfflineReadyReport["serviceWorker"]> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return { controlling: false, activated: false };
  }
  const controlling = !!navigator.serviceWorker.controller;
  let activated = false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    activated = !!reg?.active;
  } catch {
    /* ignore */
  }
  return { controlling, activated };
}

async function checkOcr(): Promise<OfflineReadyReport["ocr"]> {
  const total = OCR_ASSET_URLS.length;
  if (typeof caches === "undefined") return { ok: false, cached: 0, total };
  try {
    const cache = await caches.open(OCR_CACHE_NAME);
    const present = await Promise.all(
      OCR_ASSET_URLS.map((u) => cache.match(u).then((r) => !!r)),
    );
    const cached = present.filter(Boolean).length;
    return { ok: cached === total, cached, total };
  } catch (e) {
    console.warn("[verify] ocr check failed", e);
    return { ok: false, cached: 0, total };
  }
}

export async function verifyOfflineReady(
  versions: SrdVersion[] = ["2014", "2024"],
): Promise<OfflineReadyReport> {
  const [data, precache, serviceWorker, ocr] = await Promise.all([
    checkData(versions),
    checkPrecache(),
    checkServiceWorker(),
    checkOcr(),
  ]);
  const ready = data.ok && precache.ok && serviceWorker.controlling && serviceWorker.activated;
  return { ready, data, precache, serviceWorker, ocr };
}

/**
 * Resolves once a service worker is active AND controlling this page (with a timeout so a stuck
 * install never hangs the caller). Used to gate offline-readiness reporting so the download button
 * can't declare success while the SW is still precaching the shell.
 */
export async function swReady(timeoutMs = 8000): Promise<boolean> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;

  const withTimeout = <T>(p: Promise<T>, ms: number) =>
    Promise.race([
      p,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("sw-timeout")), ms)),
    ]);

  try {
    await withTimeout(navigator.serviceWorker.ready, timeoutMs);
  } catch {
    return false;
  }

  if (navigator.serviceWorker.controller) return true;

  // Freshly installed (clientsClaim) — wait briefly for control to transfer.
  try {
    await withTimeout(
      new Promise<void>((resolve) => {
        const onChange = () => {
          navigator.serviceWorker.removeEventListener("controllerchange", onChange);
          resolve();
        };
        navigator.serviceWorker.addEventListener("controllerchange", onChange);
      }),
      Math.min(timeoutMs, 4000),
    );
  } catch {
    /* fall through to the current controller state */
  }

  return !!navigator.serviceWorker.controller;
}

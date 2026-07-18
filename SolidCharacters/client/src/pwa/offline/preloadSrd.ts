import { createSignal } from "solid-js";
import type { SrdLoadResult } from "../../shared/customHooks/dndInfo/info/srd/loadSrdTable";
import { loadSrdSpells } from "../../shared/customHooks/dndInfo/info/srd/spells";
import { loadSrdClasses } from "../../shared/customHooks/dndInfo/info/srd/classes";
import { loadSrdRaces } from "../../shared/customHooks/dndInfo/info/srd/races";
import { loadSrdSubraces } from "../../shared/customHooks/dndInfo/info/srd/subraces";
import { loadSrdFeats } from "../../shared/customHooks/dndInfo/info/srd/feats";
import { loadSrdBackgrounds } from "../../shared/customHooks/dndInfo/info/srd/backgrounds";
import { loadSrdItems } from "../../shared/customHooks/dndInfo/info/srd/items";
import { loadSrdSubclasses } from "../../shared/customHooks/dndInfo/info/srd/subclasses";
import { loadSrdMagicItems } from "../../shared/customHooks/dndInfo/info/srd/magicItems";
import { loadSrdMasteries } from "../../shared/customHooks/dndInfo/info/srd/masteries";
import { loadSrdMonsters } from "../../shared/customHooks/dndInfo/info/srd/monsters";
import { loadSrdRules } from "../../shared/customHooks/dndInfo/info/srd/rules";
import { swReady, verifyOfflineReady, writeNonEmptySnapshot, type OfflineReadyReport } from "./verifyOfflineReady";
import { adoptCurrentSrdVersion } from "./srdVersion";
import { OCR_ASSET_URLS } from "./ocrAssets";

export type SrdVersion = '2014' | '2024';

export interface PreloadProgress { done: number; total: number; label: string }

/** Aggregate outcome of a preload run, so the UI can report honest success vs partial failure.
 * `nonEmptyLabels` records which datasets returned rows, so verification can tell a legitimately-empty
 * dataset (e.g. 2024 subraces) apart from an evicted/missing one. */
export interface PreloadResult { succeeded: number; failed: number; total: number; failedLabels: string[]; nonEmptyLabels: string[] }

interface PreloadTask { label: string; run: () => Promise<SrdLoadResult<unknown>> }

// One concurrent request per data type would be slowest; unbounded would hammer the
// backend. A small pool keeps it brisk without flooding.
const CONCURRENCY = 4;

function buildTasks(versions: SrdVersion[]): PreloadTask[] {
  const tasks: PreloadTask[] = [];
  for (const v of versions) {
    tasks.push({ label: `${v} spells`, run: () => loadSrdSpells(v) });
    tasks.push({ label: `${v} classes`, run: () => loadSrdClasses(v) });
    tasks.push({ label: `${v} races`, run: () => loadSrdRaces(v) });
    tasks.push({ label: `${v} subraces`, run: () => loadSrdSubraces(v) });
    tasks.push({ label: `${v} feats`, run: () => loadSrdFeats(v) });
    tasks.push({ label: `${v} backgrounds`, run: () => loadSrdBackgrounds(v) });
    tasks.push({ label: `${v} items`, run: () => loadSrdItems(v) });
    tasks.push({ label: `${v} subclasses`, run: () => loadSrdSubclasses(v) });
    tasks.push({ label: `${v} monsters`, run: () => loadSrdMonsters(v) });
    tasks.push({ label: `${v} rules`, run: () => loadSrdRules(v) });
  }
  // Magic items exist for both rulesets (/api/2014/MagicItems and /api/2024/MagicItems); one task loads both.
  tasks.push({ label: 'magic items', run: () => loadSrdMagicItems() });
  // Weapon masteries are a 2024-only dataset.
  if (versions.includes('2024')) tasks.push({ label: 'masteries', run: () => loadSrdMasteries() });
  return tasks;
}

/**
 * Warms every SRD dataset for the given rulesets into IndexedDB (via the same loaders the
 * hooks use, so it's IndexedDB-first and only hits the network for what's missing). This is
 * what makes every info tab and the character builder usable offline. Safe to call
 * repeatedly — already-cached datasets resolve from IndexedDB without network.
 */
export async function preloadAllSrd(
  versions: SrdVersion[] = ['2014', '2024'],
  onProgress?: (p: PreloadProgress) => void,
): Promise<PreloadResult> {
  const tasks = buildTasks(versions);
  const total = tasks.length;
  let done = 0;
  let failed = 0;
  const failedLabels: string[] = [];
  const nonEmptyLabels: string[] = [];
  let idx = 0;

  async function worker() {
    while (idx < tasks.length) {
      const cur = tasks[idx++];
      try {
        const res = await cur.run();
        if (!res.ok) { failed++; failedLabels.push(cur.label); }
        else if (res.rows.length > 0) { nonEmptyLabels.push(cur.label); }
      } catch (e) {
        // loadSrdTable catches its own errors, but guard against an unexpected throw.
        console.error('[preload] failed', cur.label, e);
        failed++;
        failedLabels.push(cur.label);
      }
      done++;
      onProgress?.({ done, total, label: cur.label });
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, total) }, worker));
  return { succeeded: total - failed, failed, total, failedLabels, nonEmptyLabels };
}

// --- Reactive state for the UI ------------------------------------------------------

export const [preloadActive, setPreloadActive] = createSignal(false);
export const [preloadProgress, setPreloadProgress] = createSignal<PreloadProgress>({ done: 0, total: 0, label: '' });
// True only when the most recent run downloaded EVERYTHING successfully (failed === 0). A
// partial/failed run (e.g. offline) leaves this false, so the manual "Download offline data"
// button stays available for retry and we never claim "available offline" when nothing loaded.
export const [preloadComplete, setPreloadComplete] = createSignal(false);
// Outcome of the most recent run (undefined until one finishes); drives the success/warning toast.
export const [preloadResult, setPreloadResult] = createSignal<PreloadResult | undefined>();
// Verified offline-readiness report from the most recent run (data in IndexedDB + shell precached +
// SW controlling). Drives the honest success/warning toast and the OfflineStatus panel.
export const [offlineReport, setOfflineReport] = createSignal<OfflineReadyReport | undefined>();

/**
 * Warm the self-hosted OCR assets (tesseract worker, wasm core, language data) so the image-to-text
 * feature works offline. A plain fetch routes through the service worker's `ocr-assets` CacheFirst
 * route, populating Cache Storage. Kept separate from the gated data sweep: offline OCR is a
 * secondary feature (it falls back to the CDN when online), so a failure here must not block the
 * "available offline" claim. Resolves true only if every asset fetched successfully.
 */
export async function warmOcrAssets(): Promise<boolean> {
  if (typeof fetch === 'undefined') return false;
  try {
    const results = await Promise.all(
      OCR_ASSET_URLS.map(async (u) => {
        try { return (await fetch(u)).ok; } catch { return false; }
      }),
    );
    return results.every(Boolean);
  } catch {
    return false;
  }
}

// Persisted marker so the standalone auto top-up doesn't re-sweep every launch. Keyed by app
// version, so a new deploy (which may ship updated SRD data) re-warms once, then is skipped.
const PRELOAD_DONE_KEY = 'srdPreload:done';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PRELOAD_APP_VERSION = (import.meta as any).env?.VITE_APP_VERSION || 'dev';
const doneMarker = (versions: SrdVersion[]) => `${PRELOAD_APP_VERSION}:${[...versions].sort().join(',')}`;

/** True if a full preload already completed for this app version + ruleset set, so the standalone
 * auto top-up can be skipped. The manual "Download offline data" action ignores this and always runs. */
export function isOfflineDataReady(versions: SrdVersion[] = ['2014', '2024']): boolean {
  try { return localStorage.getItem(PRELOAD_DONE_KEY) === doneMarker(versions); } catch { return false; }
}
function markOfflineDataReady(versions: SrdVersion[]) {
  try { localStorage.setItem(PRELOAD_DONE_KEY, doneMarker(versions)); } catch { /* ignore */ }
}
/** Clear the "done" marker so the background auto top-up will re-run — used by the self-heal path
 * when verification finds the browser has evicted previously-cached offline data. */
export function clearOfflineDoneMarker() {
  try { localStorage.removeItem(PRELOAD_DONE_KEY); } catch { /* ignore */ }
}

let running: Promise<PreloadResult> | undefined;

/**
 * Run the offline preload once, exposing progress + outcome through the signals above.
 * Concurrent callers share the same run.
 */
export function runOfflinePreload(versions: SrdVersion[] = ['2014', '2024']): Promise<PreloadResult> {
  if (running) return running;
  setPreloadActive(true);
  setPreloadComplete(false);
  running = (async () => {
    // Give the service worker priority to finish precaching the shell and take control BEFORE we add
    // the ~17 SRD + OCR fetches. Firing them during the SW install window starved the precache
    // install in Chrome (it never activated → blank offline). Prod-only: there's no SW in dev, where
    // serviceWorker.ready would otherwise stall the whole timeout. Proceed on timeout (never deadlock).
    if (import.meta.env.PROD) await swReady(15000);

    const result = await preloadAllSrd(versions, p => setPreloadProgress(p));
    setPreloadResult(result);

    let report: OfflineReadyReport | undefined;
    if (result.failed === 0) {
      writeNonEmptySnapshot(result.nonEmptyLabels);
      report = await verifyOfflineReady(versions);
    }
    setOfflineReport(report);
    const verified = !!report?.ready;
    // Claim "available offline" only when verification confirms it — not merely that the fetches
    // returned ok. This is what makes the offline indicator trustworthy.
    setPreloadComplete(verified);
    if (verified) {
      markOfflineDataReady(versions);
      // A verified full preload just pulled the server's current data — record its version so
      // the freshness check doesn't immediately offer an "update" to a freshly seeded client.
      void adoptCurrentSrdVersion();
    }

    // Warm OCR assets LAST and in the background (largest payload, lowest priority, non-gating) so
    // they never race the precache install or the data sweep. Refresh the report when done so the
    // OCR row in the status panel updates.
    if (result.failed === 0) {
      void warmOcrAssets().then(() => { void refreshOfflineReadiness(versions); });
    }
    return result;
  })().finally(() => { setPreloadActive(false); running = undefined; });
  return running;
}

/**
 * Recompute offline readiness from the ACTUAL cache state and push it to the UI signals — so the
 * subheader chip + download button reflect reality on startup and after an offline refresh, not just
 * after a live download. No-op while a preload is running (that path owns the signals).
 */
export async function refreshOfflineReadiness(versions: SrdVersion[] = ['2014', '2024']): Promise<OfflineReadyReport | undefined> {
  if (preloadActive()) return offlineReport();
  if (import.meta.env.PROD) await swReady();
  const report = await verifyOfflineReady(versions);
  setOfflineReport(report);
  setPreloadComplete(report.ready);
  return report;
}

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

export type SrdVersion = '2014' | '2024';

export interface PreloadProgress { done: number; total: number; label: string }

/** Aggregate outcome of a preload run, so the UI can report honest success vs partial failure. */
export interface PreloadResult { succeeded: number; failed: number; total: number; failedLabels: string[] }

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
  }
  // Magic items are a 2024-only, version-agnostic dataset — load once (no /api/2014/MagicItems).
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
  let idx = 0;

  async function worker() {
    while (idx < tasks.length) {
      const cur = tasks[idx++];
      try {
        const res = await cur.run();
        if (!res.ok) { failed++; failedLabels.push(cur.label); }
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
  return { succeeded: total - failed, failed, total, failedLabels };
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

let running: Promise<PreloadResult> | undefined;

/**
 * Run the offline preload once, exposing progress + outcome through the signals above.
 * Concurrent callers share the same run.
 */
export function runOfflinePreload(versions: SrdVersion[] = ['2014', '2024']): Promise<PreloadResult> {
  if (running) return running;
  setPreloadActive(true);
  setPreloadComplete(false);
  running = preloadAllSrd(versions, p => setPreloadProgress(p))
    .then(result => {
      setPreloadResult(result);
      setPreloadComplete(result.failed === 0);
      if (result.failed === 0) markOfflineDataReady(versions);
      return result;
    })
    .finally(() => { setPreloadActive(false); running = undefined; });
  return running;
}

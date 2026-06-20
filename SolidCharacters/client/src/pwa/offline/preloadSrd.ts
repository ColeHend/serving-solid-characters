import { createSignal } from "solid-js";
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

interface PreloadTask { label: string; run: () => Promise<unknown> }

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
): Promise<void> {
  const tasks = buildTasks(versions);
  const total = tasks.length;
  let done = 0;
  let idx = 0;

  async function worker() {
    while (idx < tasks.length) {
      const cur = tasks[idx++];
      try {
        await cur.run();
      } catch (e) {
        console.error('[preload] failed', cur.label, e);
      }
      done++;
      onProgress?.({ done, total, label: cur.label });
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, total) }, worker));
}

// --- Reactive state for the UI ------------------------------------------------------

export const [preloadActive, setPreloadActive] = createSignal(false);
export const [preloadProgress, setPreloadProgress] = createSignal<PreloadProgress>({ done: 0, total: 0, label: '' });
export const [preloadComplete, setPreloadComplete] = createSignal(false);

let running: Promise<void> | undefined;

/**
 * Run the offline preload once, exposing progress through the signals above. Concurrent
 * callers share the same run.
 */
export function runOfflinePreload(versions: SrdVersion[] = ['2014', '2024']): Promise<void> {
  if (running) return running;
  setPreloadActive(true);
  setPreloadComplete(false);
  running = preloadAllSrd(versions, p => setPreloadProgress(p))
    .then(() => { setPreloadComplete(true); })
    .finally(() => { setPreloadActive(false); running = undefined; });
  return running;
}

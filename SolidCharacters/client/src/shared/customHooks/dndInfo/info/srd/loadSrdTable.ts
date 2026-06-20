import { firstValueFrom } from "rxjs";
import HttpClient$ from "../../../utility/tools/httpClientObs";

interface SrdTable<T> {
  toArray(): Promise<T[]>;
  // bulkPut may receive a mapped (keyed) shape, so accept any[].
  bulkPut(rows: any[]): Promise<unknown>;
}

interface LoadSrdTableOpts<T> {
  table: SrdTable<T>;
  endpoint: string;
  label: string;
  /** In-memory signal setter, updated once data is available. */
  setSignal?: (rows: T[]) => void;
  /** Optional transform applied only to the rows written to IndexedDB (e.g. ensure a key). */
  mapForStore?: (rows: T[]) => any[];
}

/**
 * Shared IndexedDB-first SRD loader used by every useGetSrd* hook AND the offline
 * preloader. Reads the Dexie table; if empty, fetches the API endpoint once and persists
 * the result. Resolves with { rows, ok } so callers can cache successful loads (including
 * legitimately-empty datasets) while still retrying after a failure (e.g. offline).
 */
export async function loadSrdTable<T>(opts: LoadSrdTableOpts<T>): Promise<{ rows: T[]; ok: boolean }> {
  const { table, endpoint, label, setSignal, mapForStore } = opts;
  try {
    let rows = await table.toArray();
    if (!rows.length) {
      rows = await firstValueFrom(HttpClient$.get<T[]>(endpoint));
      if (rows?.length) {
        const toStore = mapForStore ? mapForStore(rows) : rows;
        await table.bulkPut(toStore).catch(err => console.error(`Error saving ${label}:`, err));
      }
    }
    if (rows?.length && setSignal) setSignal(rows);
    return { rows: rows ?? [], ok: true };
  } catch (e) {
    console.error(`${label} load error`, e);
    return { rows: [], ok: false };
  }
}

/**
 * Wraps loadSrdTable with in-flight de-duplication: concurrent callers share one request,
 * a successful load is cached, and a failed load clears the cache so the next call retries.
 */
export function makeSrdLoader<T>(opts: LoadSrdTableOpts<T>): () => Promise<T[]> {
  let inFlight: Promise<T[]> | undefined;
  return () => {
    if (!inFlight) {
      inFlight = loadSrdTable(opts).then(r => {
        if (!r.ok) inFlight = undefined;
        return r.rows;
      });
    }
    return inFlight;
  };
}

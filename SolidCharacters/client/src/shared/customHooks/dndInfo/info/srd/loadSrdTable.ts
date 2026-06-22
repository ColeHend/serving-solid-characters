import { firstValueFrom } from "rxjs";
import HttpClient$ from "../../../utility/tools/httpClientObs";

interface SrdTable<T> {
  toArray(): Promise<T[]>;
  // bulkPut may receive a mapped (keyed) shape, so accept any[].
  bulkPut(rows: any[]): Promise<unknown>;
}

/** Outcome of a single SRD load: the rows plus whether the load succeeded (vs failed, e.g.
 * offline). `ok` is true even for a legitimately-empty dataset, so callers can tell a real
 * failure (retry) apart from "loaded, nothing there" — used by the offline preloader to report
 * honest success/partial-failure instead of always claiming "available offline". */
export type SrdLoadResult<T> = { rows: T[]; ok: boolean };

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
export async function loadSrdTable<T>(opts: LoadSrdTableOpts<T>): Promise<SrdLoadResult<T>> {
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
 * Resolves the full {rows, ok} so the offline preloader can report honest success/failure;
 * hook callers invoke it fire-and-forget and read the rows from their signals instead.
 */
export function makeSrdLoader<T>(opts: LoadSrdTableOpts<T>): () => Promise<SrdLoadResult<T>> {
  let inFlight: Promise<SrdLoadResult<T>> | undefined;
  return () => {
    if (!inFlight) {
      inFlight = loadSrdTable(opts).then(r => {
        if (!r.ok) inFlight = undefined;
        return r;
      });
    }
    return inFlight;
  };
}

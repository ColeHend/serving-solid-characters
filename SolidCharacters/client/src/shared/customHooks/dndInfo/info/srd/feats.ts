import { Feat } from "../../../../../models/generated";
import { Accessor, createMemo, createSignal } from "solid-js";
import SrdDB from "../../../utility/localDB/new/srdDB";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";
import { makeSrdLoader, type SrdLoadResult } from "./loadSrdTable";

const [feats2014, setFeats2014] = createSignal<Feat[]>([]);
const [feats2024, setFeats2024] = createSignal<Feat[]>([]);

// Feats are keyed by 'name' (Dexie primary key). Ensure each stored row has a root name
// without mutating the originals returned to the UI.
const ensureFeatName = (list: Feat[]) =>
  list.map(f => (f as any).name ? f : { ...(f as any), name: f.details?.name });

const load2014 = makeSrdLoader<Feat>({ table: SrdDB.feats, endpoint: '/api/2014/Feats', label: '2014 feats', setSignal: setFeats2014, mapForStore: ensureFeatName });
const load2024 = makeSrdLoader<Feat>({ table: SrdDB2024.feats, endpoint: '/api/2024/Feats', label: '2024 feats', setSignal: setFeats2024, mapForStore: ensureFeatName });

/** Ensure a version's feats are loaded into IndexedDB + memory. Awaitable for offline preload. */
export function loadSrdFeats(version: '2014' | '2024'): Promise<SrdLoadResult<Feat>> {
  return version === '2024' ? load2024() : load2014();
}

/**
 * Plain, non-reactive snapshot of the SRD feats currently loaded in memory (both editions). Safe to
 * call outside a reactive root (unlike useGetSrdFeats, which creates a memo) — used by the readiness
 * background-feat reference check. Returns [] until a load has populated the signals.
 */
export function srdFeatsSnapshot(): Feat[] {
  return [...feats2014(), ...feats2024()];
}

export function useGetSrdFeats(version: '2014' | '2024' | 'both' | string): Accessor<Feat[]> {
  if ((version === '2014' || version === 'both') && feats2014().length === 0) load2014();
  if ((version === '2024' || version === 'both') && feats2024().length === 0) load2024();

  return createMemo<Feat[]>(() => {
    if (version === '2014') return feats2014();
    if (version === '2024') return feats2024();
    if (version === 'both') return [...feats2014(), ...feats2024()];
    return feats2014().length ? feats2014() : feats2024();
  });
}

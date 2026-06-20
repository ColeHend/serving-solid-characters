import { MagicItem } from "../../../../../models/generated";
import { Accessor, createMemo, createSignal } from "solid-js";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";
import { makeSrdLoader, type SrdLoadResult } from "./loadSrdTable";

// Magic items are a 2024-only SRD dataset — there is no /api/2014/MagicItems endpoint (a
// request for it 404s into the SPA index.html fallback, which then fails JSON.parse). So we
// always load and serve the 2024 list, regardless of the active ruleset.
const [magicItems2024, setMagicItems2024] = createSignal<MagicItem[]>([]);

const load2024 = makeSrdLoader<MagicItem>({ table: SrdDB2024.magicItems, endpoint: '/api/2024/MagicItems', label: '2024 magicItems', setSignal: setMagicItems2024 });

/** Ensure magic items (2024-only) are loaded into IndexedDB + memory. Awaitable for offline preload. */
export function loadSrdMagicItems(): Promise<SrdLoadResult<MagicItem>> {
  return load2024();
}

// Keeps the version parameter for call-site compatibility (the aggregator passes the active
// ruleset), but magic items are version-agnostic so it is intentionally ignored.
export function useGetSrdMagicItems(_version?: '2014' | '2024' | 'both' | string): Accessor<MagicItem[]> {
  if (magicItems2024().length === 0) load2024();
  return createMemo<MagicItem[]>(() => magicItems2024());
}

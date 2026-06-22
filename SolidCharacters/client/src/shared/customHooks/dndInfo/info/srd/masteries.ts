import { WeaponMastery } from "../../../../../models/generated";
import { Accessor, createMemo, createSignal } from "solid-js";
import SrdDB from "../../../utility/localDB/new/srdDB"; // masteries live only in the (single) weaponMasteries table
import { makeSrdLoader, type SrdLoadResult } from "./loadSrdTable";

// Only 2024 currently; still expose a versioned API for consistency.
const [masteries2024, setMasteries2024] = createSignal<WeaponMastery[]>([]);

const load2024 = makeSrdLoader<WeaponMastery>({ table: SrdDB.weaponMasteries, endpoint: '/api/2024/Masteries', label: '2024 masteries', setSignal: setMasteries2024 });

/** Ensure masteries (2024-only) are loaded into IndexedDB + memory. Awaitable for offline preload. */
export function loadSrdMasteries(): Promise<SrdLoadResult<WeaponMastery>> {
  return load2024();
}

export function useGetSrdMasteries(version: '2014' | '2024' | 'both' | string = '2024'): Accessor<WeaponMastery[]> {
  if ((version === '2024' || version === 'both') && masteries2024().length === 0) load2024();

  return createMemo<WeaponMastery[]>(() => {
    if (version === '2014') return [];
    return masteries2024();
  });
}

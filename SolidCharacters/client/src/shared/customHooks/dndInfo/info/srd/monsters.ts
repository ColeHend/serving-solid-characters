import { Monster } from "../../../../../models/generated";
import { Accessor, createMemo, createSignal } from "solid-js";
import SrdDB from "../../../utility/localDB/new/srdDB";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";
import { makeSrdLoader, type SrdLoadResult } from "./loadSrdTable";

// Separate caches per version to allow switching without reload
const [monsters2014, setMonsters2014] = createSignal<Monster[]>([]);
const [monsters2024, setMonsters2024] = createSignal<Monster[]>([]);

const load2014 = makeSrdLoader<Monster>({
  table: SrdDB.monsters,
  endpoint: '/api/2014/Monsters',
  label: '2014 monsters',
  setSignal: setMonsters2014
});
const load2024 = makeSrdLoader<Monster>({
  table: SrdDB2024.monsters,
  endpoint: '/api/2024/Monsters',
  label: '2024 monsters',
  setSignal: setMonsters2024 
});

/** Ensure a version's monsters are loaded into IndexedDB + memory. Awaitable for offline preload. */
export function loadSrdMonsters(version: '2014' | '2024'): Promise<SrdLoadResult<Monster>> {
  return version === '2024' ? load2024() : load2014();
}

export function useGetSrdMonsters(version: '2014' | '2024' | 'both' | string): Accessor<Monster[]> {
  if ((version === '2014' || version === 'both') && monsters2014().length === 0) load2014();
  if ((version === '2024' || version === 'both') && monsters2024().length === 0) load2024();

  return createMemo<Monster[]>(() => {
    if (version === '2014') return monsters2014();
    if (version === '2024') return monsters2024();
    if (version === 'both') return [...monsters2014(), ...monsters2024()];
    return monsters2014().length ? monsters2014() : monsters2024();
  });
}

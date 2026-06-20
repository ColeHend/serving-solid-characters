import { MagicItem } from "../../../../../models/generated";
import { Accessor, createMemo, createSignal } from "solid-js";
import SrdDB from "../../../utility/localDB/new/srdDB";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";
import { makeSrdLoader } from "./loadSrdTable";

const [magicItems2014, setMagicItems2014] = createSignal<MagicItem[]>([]);
const [magicItems2024, setMagicItems2024] = createSignal<MagicItem[]>([]);

const load2014 = makeSrdLoader<MagicItem>({ table: SrdDB.magicItems, endpoint: '/api/2014/MagicItems', label: '2014 magicItems', setSignal: setMagicItems2014 });
const load2024 = makeSrdLoader<MagicItem>({ table: SrdDB2024.magicItems, endpoint: '/api/2024/MagicItems', label: '2024 magicItems', setSignal: setMagicItems2024 });

/** Ensure a version's magic items are loaded into IndexedDB + memory. Awaitable for offline preload. */
export function loadSrdMagicItems(version: '2014' | '2024'): Promise<MagicItem[]> {
  return version === '2024' ? load2024() : load2014();
}

export function useGetSrdMagicItems(version: '2014' | '2024' | 'both' | string): Accessor<MagicItem[]> {
  if ((version === '2014' || version === 'both') && magicItems2014().length === 0) load2014();
  if ((version === '2024' || version === 'both') && magicItems2024().length === 0) load2024();

  return createMemo<MagicItem[]>(() => {
    if (version === '2014') return magicItems2014();
    if (version === '2024') return magicItems2024();
    if (version === 'both') return [...magicItems2014(), ...magicItems2024()];
    return magicItems2014().length ? magicItems2014() : magicItems2024();
  });
}

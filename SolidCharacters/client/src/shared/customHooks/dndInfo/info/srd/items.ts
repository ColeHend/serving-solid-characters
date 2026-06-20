import { Accessor, createMemo, createSignal } from "solid-js";
import SrdDB from "../../../utility/localDB/new/srdDB";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";
import { srdItem } from "../../../../../models/data/generated";
import { makeSrdLoader } from "./loadSrdTable";

const [items2014, setItems2014] = createSignal<srdItem[]>([]);
const [items2024, setItems2024] = createSignal<srdItem[]>([]);

const load2014 = makeSrdLoader<srdItem>({ table: SrdDB.items, endpoint: '/api/2014/Items', label: '2014 items', setSignal: setItems2014 });
const load2024 = makeSrdLoader<srdItem>({ table: SrdDB2024.items, endpoint: '/api/2024/Items', label: '2024 items', setSignal: setItems2024 });

/** Ensure a version's items are loaded into IndexedDB + memory. Awaitable for offline preload. */
export function loadSrdItems(version: '2014' | '2024'): Promise<srdItem[]> {
  return version === '2024' ? load2024() : load2014();
}

export function useGetSrdItems(version: '2014' | '2024' | 'both' | string): Accessor<srdItem[]> {
  if ((version === '2014' || version === 'both') && items2014().length === 0) load2014();
  if ((version === '2024' || version === 'both') && items2024().length === 0) load2024();

  return createMemo<srdItem[]>(() => {
    if (version === '2014') return items2014();
    if (version === '2024') return items2024();
    if (version === 'both') return [...items2014(), ...items2024()];
    return items2014().length ? items2014() : items2024();
  });
}

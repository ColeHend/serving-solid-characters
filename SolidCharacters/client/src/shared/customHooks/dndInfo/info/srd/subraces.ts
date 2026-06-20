import { Subrace } from "../../../../../models/generated";
import { Accessor, createMemo, createSignal } from "solid-js";
import SrdDB from "../../../utility/localDB/new/srdDB";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";
import { makeSrdLoader, type SrdLoadResult } from "./loadSrdTable";

const [subraces2014, setSubraces2014] = createSignal<Subrace[]>([]);
const [subraces2024, setSubraces2024] = createSignal<Subrace[]>([]);

const load2014 = makeSrdLoader<Subrace>({ table: SrdDB.subraces, endpoint: '/api/2014/Subraces', label: '2014 subraces', setSignal: setSubraces2014 });
const load2024 = makeSrdLoader<Subrace>({ table: SrdDB2024.subraces, endpoint: '/api/2024/Subraces', label: '2024 subraces', setSignal: setSubraces2024 });

/** Ensure a version's subraces are loaded into IndexedDB + memory. Awaitable for offline preload. */
export function loadSrdSubraces(version: '2014' | '2024'): Promise<SrdLoadResult<Subrace>> {
  return version === '2024' ? load2024() : load2014();
}

export function useGetSrdSubraces(version: '2014' | '2024' | 'both' | string): Accessor<Subrace[]> {
  if ((version === '2014' || version === 'both') && subraces2014().length === 0) load2014();
  if ((version === '2024' || version === 'both') && subraces2024().length === 0) load2024();

  return createMemo<Subrace[]>(() => {
    if (version === '2014') return subraces2014();
    if (version === '2024') return subraces2024();
    if (version === 'both') return [...subraces2014(), ...subraces2024()];
    return subraces2014().length ? subraces2014() : subraces2024();
  });
}

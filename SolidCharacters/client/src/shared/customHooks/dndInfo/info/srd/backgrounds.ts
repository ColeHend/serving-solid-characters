import { Background } from "../../../../../models/generated";
import { Accessor, createMemo, createSignal } from "solid-js";
import SrdDB from "../../../utility/localDB/new/srdDB";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";
import { makeSrdLoader, type SrdLoadResult } from "./loadSrdTable";

const [backgrounds2014, setBackgrounds2014] = createSignal<Background[]>([]);
const [backgrounds2024, setBackgrounds2024] = createSignal<Background[]>([]);

const load2014 = makeSrdLoader<Background>({ table: SrdDB.backgrounds, endpoint: '/api/2014/Backgrounds', label: '2014 backgrounds', setSignal: setBackgrounds2014 });
const load2024 = makeSrdLoader<Background>({ table: SrdDB2024.backgrounds, endpoint: '/api/2024/Backgrounds', label: '2024 backgrounds', setSignal: setBackgrounds2024 });

/** Ensure a version's backgrounds are loaded into IndexedDB + memory. Awaitable for offline preload. */
export function loadSrdBackgrounds(version: '2014' | '2024'): Promise<SrdLoadResult<Background>> {
  return version === '2024' ? load2024() : load2014();
}

export function useGetSrdBackgrounds(version: '2014' | '2024' | 'both' | string): Accessor<Background[]> {
  if ((version === '2014' || version === 'both') && backgrounds2014().length === 0) load2014();
  if ((version === '2024' || version === 'both') && backgrounds2024().length === 0) load2024();

  return createMemo<Background[]>(() => {
    if (version === '2014') return backgrounds2014();
    if (version === '2024') return backgrounds2024();
    if (version === 'both') return [...backgrounds2014(), ...backgrounds2024()];
    return backgrounds2014().length ? backgrounds2014() : backgrounds2024();
  });
}

import { Race } from "../../../../../models/generated";
import { Accessor, createMemo, createSignal } from "solid-js";
import SrdDB from "../../../utility/localDB/new/srdDB";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";
import { makeSrdLoader, type SrdLoadResult } from "./loadSrdTable";

const [races2014, setRaces2014] = createSignal<Race[]>([]);
const [races2024, setRaces2024] = createSignal<Race[]>([]);

const load2014 = makeSrdLoader<Race>({ table: SrdDB.races, endpoint: '/api/2014/Races', label: '2014 races', setSignal: setRaces2014 });
const load2024 = makeSrdLoader<Race>({ table: SrdDB2024.races, endpoint: '/api/2024/Races', label: '2024 races', setSignal: setRaces2024 });

/** Ensure a version's races are loaded into IndexedDB + memory. Awaitable for offline preload. */
export function loadSrdRaces(version: '2014' | '2024'): Promise<SrdLoadResult<Race>> {
  return version === '2024' ? load2024() : load2014();
}

export function useGetSrdRaces(version: '2014' | '2024' | 'both' | string): Accessor<Race[]> {
  if ((version === '2014' || version === 'both') && races2014().length === 0) load2014();
  if ((version === '2024' || version === 'both') && races2024().length === 0) load2024();

  return createMemo<Race[]>(() => {
    if (version === '2014') return races2014();
    if (version === '2024') return races2024();
    if (version === 'both') return [...races2014(), ...races2024()];
    return races2014().length ? races2014() : races2024();
  });
}

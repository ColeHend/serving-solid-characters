import { Subclass } from "../../../../../models/generated";
import { Accessor, createMemo, createSignal } from "solid-js";
import SrdDB from "../../../utility/localDB/new/srdDB";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";
import { makeSrdLoader, type SrdLoadResult } from "./loadSrdTable";

const [subclasses2014, setSubclasses2014] = createSignal<Subclass[]>([]);
const [subclasses2024, setSubclasses2024] = createSignal<Subclass[]>([]);

const load2014 = makeSrdLoader<Subclass>({ table: SrdDB.subclasses, endpoint: '/api/2014/Subclasses', label: '2014 subclasses', setSignal: setSubclasses2014 });
const load2024 = makeSrdLoader<Subclass>({ table: SrdDB2024.subclasses, endpoint: '/api/2024/Subclasses', label: '2024 subclasses', setSignal: setSubclasses2024 });

/** Ensure a version's subclasses are loaded into IndexedDB + memory. Awaitable for offline preload. */
export function loadSrdSubclasses(version: '2014' | '2024'): Promise<SrdLoadResult<Subclass>> {
  return version === '2024' ? load2024() : load2014();
}

export function useGetSrdSubclasses(version: '2014' | '2024' | 'both' | string): Accessor<Subclass[]> {
  if ((version === '2014' || version === 'both') && subclasses2014().length === 0) load2014();
  if ((version === '2024' || version === 'both') && subclasses2024().length === 0) load2024();

  return createMemo<Subclass[]>(() => {
    if (version === '2014') return subclasses2014();
    if (version === '2024') return subclasses2024();
    if (version === 'both') return [...subclasses2014(), ...subclasses2024()];
    return subclasses2014().length ? subclasses2014() : subclasses2024();
  });
}

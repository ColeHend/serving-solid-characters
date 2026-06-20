import { Class5E } from "../../../../../models/generated";
import { Accessor, createMemo, createSignal } from "solid-js";
import SrdDB from "../../../utility/localDB/new/srdDB";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";
import { makeSrdLoader } from "./loadSrdTable";

const [classes2014, setClasses2014] = createSignal<Class5E[]>([]);
const [classes2024, setClasses2024] = createSignal<Class5E[]>([]);

const load2014 = makeSrdLoader<Class5E>({ table: SrdDB.classes, endpoint: '/api/2014/Classes', label: '2014 classes', setSignal: setClasses2014 });
const load2024 = makeSrdLoader<Class5E>({ table: SrdDB2024.classes, endpoint: '/api/2024/Classes', label: '2024 classes', setSignal: setClasses2024 });

/** Ensure a version's classes are loaded into IndexedDB + memory. Awaitable for offline preload. */
export function loadSrdClasses(version: '2014' | '2024'): Promise<Class5E[]> {
  return version === '2024' ? load2024() : load2014();
}

export function useGetSrdClasses(version: '2014' | '2024' | 'both' | string): Accessor<Class5E[]> {
  if ((version === '2014' || version === 'both') && classes2014().length === 0) load2014();
  if ((version === '2024' || version === 'both') && classes2024().length === 0) load2024();

  return createMemo<Class5E[]>(() => {
    if (version === '2014') return classes2014();
    if (version === '2024') return classes2024();
    if (version === 'both') return [...classes2014(), ...classes2024()];
    return classes2014().length ? classes2014() : classes2024();
  });
}

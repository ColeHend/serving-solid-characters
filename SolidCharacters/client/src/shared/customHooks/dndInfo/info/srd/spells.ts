import { Spell } from "../../../../../models/generated";
import { Accessor, createMemo, createSignal } from "solid-js";
import SrdDB from "../../../utility/localDB/new/srdDB";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";
import { makeSrdLoader, type SrdLoadResult } from "./loadSrdTable";

// Separate caches per version to allow switching without reload
const [spells2014, setSpells2014] = createSignal<Spell[]>([]);
const [spells2024, setSpells2024] = createSignal<Spell[]>([]);

const load2014 = makeSrdLoader<Spell>({ table: SrdDB.spells, endpoint: '/api/2014/Spells', label: '2014 spells', setSignal: setSpells2014 });
const load2024 = makeSrdLoader<Spell>({ table: SrdDB2024.spells, endpoint: '/api/2024/Spells', label: '2024 spells', setSignal: setSpells2024 });

/** Ensure a version's spells are loaded into IndexedDB + memory. Awaitable for offline preload. */
export function loadSrdSpells(version: '2014' | '2024'): Promise<SrdLoadResult<Spell>> {
  return version === '2024' ? load2024() : load2014();
}

export function useGetSrdSpells(version: '2014' | '2024' | 'both' | string): Accessor<Spell[]> {
  if ((version === '2014' || version === 'both') && spells2014().length === 0) load2014();
  if ((version === '2024' || version === 'both') && spells2024().length === 0) load2024();

  return createMemo<Spell[]>(() => {
    if (version === '2014') return spells2014();
    if (version === '2024') return spells2024();
    if (version === 'both') return [...spells2014(), ...spells2024()];
    return spells2014().length ? spells2014() : spells2024();
  });
}

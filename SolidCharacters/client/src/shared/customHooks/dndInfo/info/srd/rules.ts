import { Rule } from "../../../../../models/generated";
import { Accessor, createMemo, createSignal } from "solid-js";
import SrdDB from "../../../utility/localDB/new/srdDB";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";
import { makeSrdLoader, type SrdLoadResult } from "./loadSrdTable";

// Separate caches per version to allow switching without reload
const [rules2014, setRules2014] = createSignal<Rule[]>([]);
const [rules2024, setRules2024] = createSignal<Rule[]>([]);

const load2014 = makeSrdLoader<Rule>({ table: SrdDB.rules, endpoint: '/api/2014/Rules', label: '2014 rules', setSignal: setRules2014 });
const load2024 = makeSrdLoader<Rule>({ table: SrdDB2024.rules, endpoint: '/api/2024/Rules', label: '2024 rules', setSignal: setRules2024 });

/** Ensure a version's rules are loaded into IndexedDB + memory. Awaitable for offline preload. */
export function loadSrdRules(version: '2014' | '2024'): Promise<SrdLoadResult<Rule>> {
  return version === '2024' ? load2024() : load2014();
}

export function useGetSrdRules(version: '2014' | '2024' | 'both' | string): Accessor<Rule[]> {
  if ((version === '2014' || version === 'both') && rules2014().length === 0) load2014();
  if ((version === '2024' || version === 'both') && rules2024().length === 0) load2024();

  return createMemo<Rule[]>(() => {
    if (version === '2014') return rules2014();
    if (version === '2024') return rules2024();
    if (version === 'both') return [...rules2014(), ...rules2024()];
    return rules2014().length ? rules2014() : rules2024();
  });
}

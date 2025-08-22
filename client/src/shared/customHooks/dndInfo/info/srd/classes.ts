import { Class5E } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";
import { Accessor, createMemo, createSignal } from "solid-js";

// Version‑separated caches mirroring spells pattern
const [classes2014, setClasses2014] = createSignal<Class5E[]>([]);
const [classes2024, setClasses2024] = createSignal<Class5E[]>([]);
let loading2014 = false;
let loading2024 = false;

export function useGetSrdClasses(version: '2014' | '2024' | 'both' | string): Accessor<Class5E[]> {
  if ((version === '2014' || version === 'both') && classes2014().length === 0 && !loading2014) {
    loading2014 = true;
    const local$ = HttpClient$.toObservable(SrdDB.classes.toArray());
    local$.pipe(
      take(1),
      concatMap(cached => cached.length ? of(cached) : fetchClasses('2014')),
      tap(list => { if (list?.length) SrdDB.classes.bulkPut(list).catch(err => console.error('Error saving 2014 classes:', err)); })
    ).subscribe({
      next: list => setClasses2014(list),
      error: e => console.error('2014 classes load error', e),
      complete: () => { loading2014 = false; }
    });
  }

  if ((version === '2024' || version === 'both') && classes2024().length === 0 && !loading2024) {
    loading2024 = true;
    const local$ = HttpClient$.toObservable(SrdDB2024.classes.toArray());
    local$.pipe(
      take(1),
      concatMap(cached => cached.length ? of(cached) : fetchClasses('2024')),
      tap(list => { if (list?.length) SrdDB2024.classes.bulkPut(list).catch(err => console.error('Error saving 2024 classes:', err)); })
    ).subscribe({
      next: list => setClasses2024(list),
      error: e => console.error('2024 classes load error', e),
      complete: () => { loading2024 = false; }
    });
  }

  return createMemo<Class5E[]>(() => {
    if (version === '2014') return classes2014();
    if (version === '2024') return classes2024();
    if (version === 'both') return [...classes2014(), ...classes2024()];
    return classes2014().length ? classes2014() : classes2024();
  });
}

function fetchClasses(version: '2014' | '2024') {
  return HttpClient$.get<Class5E[]>(`/api/${version}/Classes`).pipe(take(1));
}
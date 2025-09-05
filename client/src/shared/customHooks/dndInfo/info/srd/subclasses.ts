import { Subclass } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";
import { Accessor, createMemo, createSignal } from "solid-js";

const [subclasses2014, setSubclasses2014] = createSignal<Subclass[]>([]);
const [subclasses2024, setSubclasses2024] = createSignal<Subclass[]>([]);
let loading2014 = false;
let loading2024 = false;

export function useGetSrdSubclasses(version: '2014' | '2024' | 'both' | string): Accessor<Subclass[]> {
  if ((version === '2014' || version === 'both') && subclasses2014().length === 0 && !loading2014) {
    loading2014 = true;
    const local$ = HttpClient$.toObservable(SrdDB.subclasses.toArray());
    local$.pipe(
      take(1),
      concatMap(cached => cached.length > 0 ? of(cached) : fetchSubclasses('2014')),
      tap(list => { 
        if (list?.length) {
          SrdDB.subclasses.bulkPut(list).catch(err => console.error('Error saving 2014 subclasses:', err));
        } 
      })
    ).subscribe({
      next: list => setSubclasses2014(list),
      error: e => console.error('2014 subclasses load error', e),
      complete: () => { loading2014 = false; }
    });
  }

  if ((version === '2024' || version === 'both') && subclasses2024().length === 0 && !loading2024) {
    loading2024 = true;
    const local$ = HttpClient$.toObservable(SrdDB2024.subclasses.toArray());
    local$.pipe(
      take(1),
      concatMap(cached => cached.length ? of(cached) : fetchSubclasses('2024')),
      tap(list => { if (list?.length) SrdDB2024.subclasses.bulkPut(list).catch(err => console.error('Error saving 2024 subclasses:', err)); })
    ).subscribe({
      next: list => setSubclasses2024(list),
      error: e => console.error('2024 subclasses load error', e),
      complete: () => { loading2024 = false; }
    });
  }

  return createMemo<Subclass[]>(() => {
    if (version === '2014') return subclasses2014();
    if (version === '2024') return subclasses2024();
    if (version === 'both') return [...subclasses2014(), ...subclasses2024()];
    return subclasses2014().length ? subclasses2014() : subclasses2024();
  });
}

function fetchSubclasses(version: '2014' | '2024') {
  console.log("ran");
  
  return HttpClient$.get<Subclass[]>(`/api/${version}/Subclasses`).pipe(take(1));
}
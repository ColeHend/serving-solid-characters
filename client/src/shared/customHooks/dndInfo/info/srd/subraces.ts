import { Subrace } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";
import { Accessor, createMemo, createSignal } from "solid-js";

const [subraces2014, setSubraces2014] = createSignal<Subrace[]>([]);
const [subraces2024, setSubraces2024] = createSignal<Subrace[]>([]);
let loading2014 = false;
let loading2024 = false;

export function useGetSrdSubraces(version: '2014' | '2024' | 'both' | string): Accessor<Subrace[]> {
  if ((version === '2014' || version === 'both') && subraces2014().length === 0 && !loading2014) {
    loading2014 = true;
    const local$ = HttpClient$.toObservable(SrdDB.subraces?.toArray());
    local$.pipe(
      take(1),
      concatMap(cached => cached.length ? of(cached) : fetchSubraces('2014')),
      tap(list => { if (list?.length) SrdDB.subraces.bulkPut(list).catch(err => console.error('Error saving 2014 subraces:', err)); })
    ).subscribe({
      next: list => setSubraces2014(list),
      error: e => console.error('2014 subraces load error', e),
      complete: () => { loading2014 = false; }
    });
  }

  if ((version === '2024' || version === 'both') && subraces2024().length === 0 && !loading2024) {
    loading2024 = true;
    const local$ = HttpClient$.toObservable(SrdDB2024.subraces?.toArray());
    local$.pipe(
      take(1),
      concatMap(cached => cached.length ? of(cached) : fetchSubraces('2024')),
      tap(list => { if (list?.length) SrdDB2024.subraces.bulkPut(list).catch(err => console.error('Error saving 2024 subraces:', err)); })
    ).subscribe({
      next: list => setSubraces2024(list),
      error: e => console.error('2024 subraces load error', e),
      complete: () => { loading2024 = false; }
    });
  }

  return createMemo<Subrace[]>(() => {
    if (version === '2014') return subraces2014();
    if (version === '2024') return subraces2024();
    if (version === 'both') return [...subraces2014(), ...subraces2024()];
    return subraces2014().length ? subraces2014() : subraces2024();
  });
}

function fetchSubraces(version: '2014' | '2024') {
  return HttpClient$.get<Subrace[]>(`/api/${version}/Subraces`).pipe(take(1));
}
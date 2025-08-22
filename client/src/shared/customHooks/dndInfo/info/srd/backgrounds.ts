import { Background } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";
import { Accessor, createMemo, createSignal } from "solid-js";

const [backgrounds2014, setBackgrounds2014] = createSignal<Background[]>([]);
const [backgrounds2024, setBackgrounds2024] = createSignal<Background[]>([]);
let loading2014 = false;
let loading2024 = false;

export function useGetSrdBackgrounds(version: '2014' | '2024' | 'both' | string): Accessor<Background[]> {
  if ((version === '2014' || version === 'both') && backgrounds2014().length === 0 && !loading2014) {
    loading2014 = true;
    const local$ = HttpClient$.toObservable(SrdDB.backgrounds.toArray());
    local$.pipe(
      take(1),
      concatMap(cached => cached.length ? of(cached) : fetchBackgrounds('2014')),
      tap(list => { if (list?.length) SrdDB.backgrounds.bulkPut(list).catch(err => console.error('Error saving 2014 backgrounds:', err)); })
    ).subscribe({
      next: list => setBackgrounds2014(list),
      error: e => console.error('2014 backgrounds load error', e),
      complete: () => { loading2014 = false; }
    });
  }

  if ((version === '2024' || version === 'both') && backgrounds2024().length === 0 && !loading2024) {
    loading2024 = true;
    const local$ = HttpClient$.toObservable(SrdDB2024.backgrounds.toArray());
    local$.pipe(
      take(1),
      concatMap(cached => cached.length ? of(cached) : fetchBackgrounds('2024')),
      tap(list => { if (list?.length) SrdDB2024.backgrounds.bulkPut(list).catch(err => console.error('Error saving 2024 backgrounds:', err)); })
    ).subscribe({
      next: list => setBackgrounds2024(list),
      error: e => console.error('2024 backgrounds load error', e),
      complete: () => { loading2024 = false; }
    });
  }

  return createMemo<Background[]>(() => {
    if (version === '2014') return backgrounds2014();
    if (version === '2024') return backgrounds2024();
    if (version === 'both') return [...backgrounds2014(), ...backgrounds2024()];
    return backgrounds2014().length ? backgrounds2014() : backgrounds2024();
  });
}

function fetchBackgrounds(version: '2014' | '2024') {
  return HttpClient$.get<Background[]>(`/api/${version}/Backgrounds`).pipe(take(1));
}
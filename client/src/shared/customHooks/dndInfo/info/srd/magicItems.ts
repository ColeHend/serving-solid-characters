import { MagicItem } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";
import { Accessor, createMemo, createSignal } from "solid-js";

const [magicItems2014, setMagicItems2014] = createSignal<MagicItem[]>([]);
const [magicItems2024, setMagicItems2024] = createSignal<MagicItem[]>([]);
let loading2014 = false;
let loading2024 = false;

export function useGetSrdMagicItems(version: '2014' | '2024' | 'both' | string): Accessor<MagicItem[]> {
  if ((version === '2014' || version === 'both') && magicItems2014().length === 0 && !loading2014) {
    loading2014 = true;
    const local$ = HttpClient$.toObservable(SrdDB.magicItems.toArray());
    local$.pipe(
      take(1),
      concatMap(cached => cached.length ? of(cached) : fetchMagicItems('2014')),
      tap(list => { if (list?.length) SrdDB.magicItems.bulkPut(list).catch(err => console.error('Error saving 2014 magicItems:', err)); })
    ).subscribe({
      next: list => setMagicItems2014(list),
      error: e => console.error('2014 magicItems load error', e),
      complete: () => { loading2014 = false; }
    });
  }

  if ((version === '2024' || version === 'both') && magicItems2024().length === 0 && !loading2024) {
    loading2024 = true;
    const local$ = HttpClient$.toObservable(SrdDB2024.magicItems.toArray());
    local$.pipe(
      take(1),
      concatMap(cached => cached.length ? of(cached) : fetchMagicItems('2024')),
      tap(list => { if (list?.length) SrdDB2024.magicItems.bulkPut(list).catch(err => console.error('Error saving 2024 magicItems:', err)); })
    ).subscribe({
      next: list => setMagicItems2024(list),
      error: e => console.error('2024 magicItems load error', e),
      complete: () => { loading2024 = false; }
    });
  }

  return createMemo<MagicItem[]>(() => {
    if (version === '2014') return magicItems2014();
    if (version === '2024') return magicItems2024();
    if (version === 'both') return [...magicItems2014(), ...magicItems2024()];
    return magicItems2014().length ? magicItems2014() : magicItems2024();
  });
}

function fetchMagicItems(version: '2014' | '2024') {
  return HttpClient$.get<MagicItem[]>(`/api/${version}/MagicItems`).pipe(take(1));
}
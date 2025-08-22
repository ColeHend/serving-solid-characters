import { Feat } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";
import { Accessor, createMemo, createSignal } from "solid-js";

const [feats2014, setFeats2014] = createSignal<Feat[]>([]);
const [feats2024, setFeats2024] = createSignal<Feat[]>([]);
let loading2014 = false;
let loading2024 = false;

export function useGetSrdFeats(version: '2014' | '2024' | 'both' | string): Accessor<Feat[]> {
  if ((version === '2014' || version === 'both') && feats2014().length === 0 && !loading2014) {
    loading2014 = true;
    const local$ = HttpClient$.toObservable(SrdDB.feats.toArray());
    local$.pipe(
      take(1),
      concatMap(cached => cached.length ? of(cached) : fetchFeats('2014')),
      tap(list => { if (list?.length) SrdDB.feats.bulkPut(list).catch(err => console.error('Error saving 2014 feats:', err)); })
    ).subscribe({
      next: list => setFeats2014(list),
      error: e => console.error('2014 feats load error', e),
      complete: () => { loading2014 = false; }
    });
  }

  if ((version === '2024' || version === 'both') && feats2024().length === 0 && !loading2024) {
    loading2024 = true;
    const local$ = HttpClient$.toObservable(SrdDB2024.feats.toArray());
    local$.pipe(
      take(1),
      concatMap(cached => cached.length ? of(cached) : fetchFeats('2024')),
      tap(list => { if (list?.length) SrdDB2024.feats.bulkPut(list).catch(err => console.error('Error saving 2024 feats:', err)); })
    ).subscribe({
      next: list => setFeats2024(list),
      error: e => console.error('2024 feats load error', e),
      complete: () => { loading2024 = false; }
    });
  }

  return createMemo<Feat[]>(() => {
    if (version === '2014') return feats2014();
    if (version === '2024') return feats2024();
    if (version === 'both') return [...feats2014(), ...feats2024()];
    return feats2014().length ? feats2014() : feats2024();
  });
}

function fetchFeats(version: '2014' | '2024') {
  return HttpClient$.get<Feat[]>(`/api/${version}/Feats`).pipe(take(1));
}
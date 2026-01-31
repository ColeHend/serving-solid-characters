import { Spell } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { combineLatest, concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";
import { Accessor, createMemo, createSignal } from "solid-js";

// Separate caches per version to allow switching without reload
const [spells2014, setSpells2014] = createSignal<Spell[]>([]);
const [spells2024, setSpells2024] = createSignal<Spell[]>([]);
let loading2014 = false;
let loading2024 = false;

export function useGetSrdSpells(version: '2014' | '2024' | 'both' | string): Accessor<Spell[]> {
  // Kick off fetches lazily based on requested version
  if ((version === '2014' || version === 'both') && spells2014().length === 0 && !loading2014) {
    loading2014 = true;
    const srdDB2014$ = HttpClient$.toObservable(SrdDB.spells.toArray());
    srdDB2014$.pipe(
      take(1),
      concatMap((cached) => {
        if (cached.length > 0) return of(cached);
        return fetchSpells('2014');
      }),
      tap(list => {
        if (list?.length) {
          SrdDB.spells.bulkPut(list).catch(err => console.error('Error saving 2014 spells:', err));
        }
      })
    ).subscribe({
      next: (list) => setSpells2014(list),
      error: (e) => { console.error('2014 spells load error', e); },
      complete: () => { loading2014 = false; }
    });
  }

  if ((version === '2024' || version === 'both') && spells2024().length === 0 && !loading2024) {
    loading2024 = true;
    const srdDB2024$ = HttpClient$.toObservable(SrdDB2024.spells.toArray());
    srdDB2024$.pipe(
      take(1),
      concatMap((cached) => {
        if (cached.length > 0) return of(cached);
        return fetchSpells('2024');
      }),
      tap(list => {
        if (list?.length) {
          SrdDB2024.spells.bulkPut(list).catch(err => console.error('Error saving 2024 spells:', err));
        }
      })
    ).subscribe({
      next: (list) => setSpells2024(list),
      error: (e) => { console.error('2024 spells load error', e); },
      complete: () => { loading2024 = false; }
    });
  }

  return createMemo<Spell[]>(() => {
    if (version === '2014') return spells2014();
    if (version === '2024') return spells2024();
    if (version === 'both') return [...spells2014(), ...spells2024()];

    return spells2014().length ? spells2014() : spells2024();
  });
}

function fetchSpells(version: '2014' | '2024') {
  return HttpClient$.get<Spell[]>(`/api/${version}/Spells`).pipe(take(1));
}
import { WeaponMastery } from "../../../../../models/generated";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB"; // assuming masteries live only in 2024 DB; keep single DB
import { Accessor, createMemo, createSignal } from "solid-js";

// Only 2024 currently; still expose versioned API for consistency
const [masteries2024, setMasteries2024] = createSignal<WeaponMastery[]>([]);
let loading2024 = false;

export function useGetSrdMasteries(version: '2014' | '2024' | 'both' | string = '2024'): Accessor<WeaponMastery[]> {
  if ((version === '2024' || version === 'both') && masteries2024().length === 0 && !loading2024) {
    loading2024 = true;
    const local$ = HttpClient$.toObservable(SrdDB.weaponMasteries.toArray());
    local$.pipe(
      take(1),
      concatMap(cached => cached.length ? of(cached) : fetchMasteries('2024')),
      tap(list => { if (list?.length) SrdDB.weaponMasteries.bulkPut(list).catch(err => console.error('Error saving 2024 masteries:', err)); })
    ).subscribe({
      next: list => setMasteries2024(list),
      error: e => console.error('2024 masteries load error', e),
      complete: () => { loading2024 = false; }
    });
  }

  return createMemo<WeaponMastery[]>(() => {
    if (version === '2014') return [];
    if (version === '2024') return masteries2024();
    if (version === 'both') return masteries2024();
    return masteries2024();
  });
}

function fetchMasteries(_version: '2014' | '2024') {
  return HttpClient$.get<WeaponMastery[]>(`/api/2024/Masteries`).pipe(take(1));
}

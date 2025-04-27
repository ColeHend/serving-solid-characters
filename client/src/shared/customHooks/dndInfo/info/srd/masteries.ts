import { WeaponMastery } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import { createSignal } from "solid-js";

const [masteries, setMasteries] = createSignal<WeaponMastery[]>([]);

/**
 *  * Dnd 5E 2024 Masteries
 * @returns {WeaponMastery[]} - Returns the list of weapon masteries
 */
export function useGetSrdMasteries() {
  const LocalMasteries = HttpClient$.toObservable(SrdDB.weaponMasteries.toArray());

  if (masteries().length === 0) {
    LocalMasteries.pipe(
      take(1),
      concatMap((masteries) => {
        if (masteries.length > 0) {
          return of(masteries);
        } else {
          return of([])
        }
      }),
      concatMap((masteries) => {
        if (masteries.length === 0) {
          return fetchMasteries();
        } else {
          return of(masteries);
        }
      }),
      tap((masteries) => !!masteries && masteries.length > 0 ? setMasteries(masteries) : null),
    ).subscribe();
  }
  return masteries;
}

function fetchMasteries() {
  return HttpClient$.get<WeaponMastery[]>(`/api/2024/Masteries`).pipe(
    take(1)
  )
}

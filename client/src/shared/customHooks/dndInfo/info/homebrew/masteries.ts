import { WeaponMastery } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import HombrewDB from "../../../utility/localDB/new/homebrewDB";
import { createSignal } from "solid-js";

const [weaponMastery, setWeaponMastery] = createSignal<WeaponMastery[]>([]);

export function useGetHombrewWeaponMastery() {
  const LocalItems = HttpClient$.toObservable(HombrewDB.weaponMasteries.toArray());

  if (weaponMastery().length === 0) {
    LocalItems.pipe(
      take(1),
      concatMap((items) => {
        if (items.length > 0) {
          return of(items);
        } else {
          return of([])
        }
      }),
      tap((items) => !!items && items.length > 0 ? setWeaponMastery(items) : null),
    ).subscribe();
  }
  return weaponMastery;
}
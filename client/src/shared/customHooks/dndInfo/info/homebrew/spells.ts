import { Spell } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import HombrewDB from "../../../utility/localDB/new/homebrewDB";
import { createSignal } from "solid-js";

const [spells, setSpells] = createSignal<Spell[]>([]);

export function useGetHombrewSpells() {
  const LocalClasses = HttpClient$.toObservable(HombrewDB.spells.toArray());

  if (spells().length === 0) {
    LocalClasses.pipe(
      take(1),
      concatMap((classes) => {
        if (classes.length > 0) {
          return of(classes);
        } else {
          return of([])
        }
      }),
      tap((classes) => !!classes && classes.length > 0 ? setSpells(classes) : null),
    ).subscribe();
  }
  return spells;
}
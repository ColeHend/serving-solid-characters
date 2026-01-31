import { Race } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import HombrewDB from "../../../utility/localDB/new/homebrewDB";
import { createSignal } from "solid-js";

const [race, setRace] = createSignal<Race[]>([]);

export function useGetHombrewRaces() {
  const LocalItems = HttpClient$.toObservable(HombrewDB.races.toArray());

  if (race().length === 0) {
    LocalItems.pipe(
      take(1),
      concatMap((items) => {
        if (items.length > 0) {
          return of(items);
        } else {
          return of([])
        }
      }),
      tap((items) => !!items && items.length > 0 ? setRace(items) : null),
    ).subscribe();
  }
  return race;
}
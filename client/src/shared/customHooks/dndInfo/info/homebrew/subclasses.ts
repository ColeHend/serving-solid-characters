import { Subclass } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import HombrewDB from "../../../utility/localDB/new/homebrewDB";
import { createSignal } from "solid-js";

const [subclasses, setSubclasses] = createSignal<Subclass[]>([]);

export function useGetHombrewSubclasses() {
  const LocalSubclasses = HttpClient$.toObservable(HombrewDB.subclasses.toArray());

  if (subclasses().length === 0) {
    LocalSubclasses.pipe(
      take(1),
      concatMap((subclasses) => {
        if (subclasses.length > 0) {
          return of(subclasses);
        } else {
          return of([])
        }
      }),
      tap((subclasses) => !!subclasses && subclasses.length > 0 ? setSubclasses(subclasses) : null),
    ).subscribe();
  }
  return subclasses;
}
import { Subrace } from "../../../../../models/generated";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import HombrewDB from "../../../utility/localDB/new/homebrewDB";
import { createSignal } from "solid-js";

const [subrace, setSubrace] = createSignal<Subrace[]>([]);

export function useGetHombrewSubraces() {
  const LocalItems = HttpClient$.toObservable(HombrewDB.subraces.toArray());

  if (subrace().length === 0) {
    LocalItems.pipe(
      take(1),
      concatMap((items) => {
        if (items.length > 0) {
          return of(items);
        } else {
          return of([])
        }
      }),
      tap((items) => !!items && items.length > 0 ? setSubrace(items) : null),
    ).subscribe();
  }
  return subrace;
}
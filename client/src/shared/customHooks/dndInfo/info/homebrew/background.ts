import { Background } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import HombrewDB from "../../../utility/localDB/new/homebrewDB";
import { createSignal } from "solid-js";

const [backgrounds, setBackgrounds] = createSignal<Background[]>([]);

export function useGetHombrewBackgrounds() {
  const LocalBackgrounds = HttpClient$.toObservable(HombrewDB.backgrounds.toArray());

  if (backgrounds().length === 0) {
    LocalBackgrounds.pipe(
      take(1),
      concatMap((backgrounds) => {
        if (backgrounds.length > 0) {
          return of(backgrounds);
        } else {
          return of([])
        }
      }),
      tap((backgrounds) => !!backgrounds && backgrounds.length > 0 ? setBackgrounds(backgrounds) : null),
    ).subscribe();
  }
  return backgrounds;
}
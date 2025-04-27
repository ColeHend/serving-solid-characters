import { Background } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import { createSignal } from "solid-js";

const [backgrounds, setBackgrounds] = createSignal<Background[]>([]);

export function useGetSrdBackgrounds(version: '2014' | '2024' = '2014') {
  const LocalBackgrounds = HttpClient$.toObservable(SrdDB.backgrounds.toArray());

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
      concatMap((backgrounds) => {
        if (backgrounds.length === 0) {
          return fetchBackgrounds(version);
        } else {
          return of(backgrounds);
        }
      }),
      tap((backgrounds) => !!backgrounds && backgrounds.length > 0 ? setBackgrounds(backgrounds) : null),
    ).subscribe();
  }
  return backgrounds;
}

function fetchBackgrounds(version: '2014' | '2024' = '2014') {
  return HttpClient$.get<Background[]>(`/api/${version}/Backgrounds`).pipe(
    take(1),
    tap((backgrounds) => {
      if (backgrounds) {
        SrdDB.backgrounds.bulkAdd(backgrounds);
      }
    })
  )
}
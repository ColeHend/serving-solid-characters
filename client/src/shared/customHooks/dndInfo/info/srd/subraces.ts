import { Subrace } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concat, concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import { createSignal } from "solid-js";

const [subraces, setSubraces] = createSignal<Subrace[]>([]);

export function useGetSrdSubraces(version: '2014' | '2024' = '2014') {
  const LocalSubraces = HttpClient$.toObservable(SrdDB.subraces.toArray());

  if (subraces().length === 0) {
    LocalSubraces.pipe(
      take(1),
      concatMap(subraces => {
        if (subraces.length > 0) {
          return of(subraces);
        } else {
          return of([])
        }
      }),
      concatMap((subraces) => {
        if (subraces.length === 0) {
          return fetchSubraces(version);
        } else {
          return of(subraces);
        }
      }),
      tap((subraces) => !!subraces && subraces.length > 0 ? setSubraces(subraces) : null)
    ).subscribe();
  }
  return subraces
};
function fetchSubraces(version: '2014' | '2024' = '2014') {
  return HttpClient$.get<Subrace[]>(`/api/${version}/Subraces`).pipe(
    take(1),
  )
}
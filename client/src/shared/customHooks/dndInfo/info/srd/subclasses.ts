import { Subclass } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import { createSignal } from "solid-js";

const [subclasses, setSubclasses] = createSignal<Subclass[]>([]);

export function useGetSrdSubclasses(version: '2014' | '2024' = '2014') {
  const LocalSubclasses = HttpClient$.toObservable(SrdDB.subclasses.toArray());

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
      concatMap((subclasses) => {
        if (subclasses.length === 0) {
          return fetchSubclasses(version);
        } else {
          return of(subclasses);
        }
      }),
      tap((subclasses) => !!subclasses && subclasses.length > 0 ? setSubclasses(subclasses) : null),
    ).subscribe();
  }
  return subclasses;
}

function fetchSubclasses(version: '2014' | '2024' = '2014') {
  return HttpClient$.get<Subclass[]>(`/api/${version}/Subclasses`).pipe(
    take(1)
  )
}
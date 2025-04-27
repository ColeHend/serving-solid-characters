import { Class5E } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import { createSignal } from "solid-js";

const [classes, setClasses] = createSignal<Class5E[]>([]);

export function useGetSrdClasses(version: '2014' | '2024' = '2014') {
  const LocalClasses = HttpClient$.toObservable(SrdDB.classes.toArray());

  if (classes().length === 0) {
    LocalClasses.pipe(
      take(1),
      concatMap((classes) => {
        if (classes.length > 0) {
          return of(classes);
        } else {
          return of([])
        }
      }),
      concatMap((classes) => {
        if (classes.length === 0) {
          return fetchClasses(version);
        } else {
          return of(classes);
        }
      }),
      tap((classes) => !!classes && classes.length > 0 ? setClasses(classes) : null),
    ).subscribe();
  }
  return classes;
}

function fetchClasses(version: '2014' | '2024' = '2014') {
  return HttpClient$.get<Class5E[]>(`/api/${version}/Classes`).pipe(
    take(1)
  )
}
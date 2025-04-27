import { Class5E } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import HombrewDB from "../../../utility/localDB/new/homebrewDB";
import { createSignal } from "solid-js";

const [classes, setClasses] = createSignal<Class5E[]>([]);

export function useGetHombrewClasses() {
  const LocalClasses = HttpClient$.toObservable(HombrewDB.classes.toArray());

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
      tap((classes) => !!classes && classes.length > 0 ? setClasses(classes) : null),
    ).subscribe();
  }
  return classes;
}
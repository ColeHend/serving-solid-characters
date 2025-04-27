import type { DnDClass } from "../../../../models/old/class.model";
import type { Accessor } from "solid-js";
import { createSignal, onMount } from "solid-js";
import { catchError, concatMap, from, map, mergeMap, of, take, tap } from "rxjs";
import HttpClient$ from "../../utility/tools/httpClientObs";
import LocalSrdDB from "../../utility/localDB/old/srdDBFile";
import HomebrewManager from "../../homebrewManager";
import { FixClasses } from "./fixClasses";

// Create a signal with a default empty array
const [classes, setClasses] = createSignal<DnDClass[]>([]);
const [isLoading, setIsLoading] = createSignal(false);
const [hasError, setHasError] = createSignal(false);
const [errorMessage, setErrorMessage] = createSignal("");

export function useDnDClasses(): Accessor<DnDClass[]> {
  const LocalClasses = HttpClient$.toObservable(LocalSrdDB.classes.toArray());
    
  if (classes().length === 0){
    LocalClasses.pipe(
      take(1),
      concatMap((classes)=>{
        if (classes.length > 0) {
          return of(classes);
        } else {
          return of([])
        }
      }),
      concatMap((classes)=>{
        if (classes.length === 0) {
          return fetchClasses();
        } else {
          return of(classes);
        }
      }),
      concatMap((classes)=>{
        if (classes) {
          return of(classes.concat(HomebrewManager.classes()));
        }
        return of(classes);
      }),
      tap((classes) => !!classes && classes.length > 0 ? setClasses(classes) : null),
    ).subscribe();
  }

  return classes;
}

function fetchClasses() {
  return HttpClient$.get<DnDClass[]>("/api/DnDInfo/Classes").pipe(
    take(1),
    map((classes)=>FixClasses(classes)),
    catchError((err)=> {
      console.error("Error: ", err);
      return of(null);
    }),
    tap((classes)=> {
      if (classes) {
        LocalSrdDB.classes.bulkAdd(classes);
      }
    })
  );
}
export default useDnDClasses;
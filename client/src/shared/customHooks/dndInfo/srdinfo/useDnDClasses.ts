import type { DnDClass } from "../../../../models/class.model";
import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, concatMap, map, mergeMap, of, take, tap } from "rxjs";
import HttpClient$ from "../../utility/httpClientObs";
import LocalSrdDB from "../../utility/localDB/srdDBFile";
import HomebrewManager from "../../../../shared/customHooks/homebrewManager";
import { FixClasses } from "./fixClasses";

const [classes, setClasses] = createSignal<DnDClass[]>([]);

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
          return HttpClient$.post<DnDClass[]>("/api/DnDInfo/Classes",{}).pipe(
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
export default useDnDClasses;
import type { DnDClass } from "../../../models/class.model";
import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, concatMap, of, take, tap } from "rxjs";
import HttpClient$ from "../../utility/httpClientObs";
import LocalSrdDB from "../../utility/localDB/srdDBFile"

const [classes, setClasses] = createSignal<DnDClass[]>([]);

export default function useDnDClasses(): Accessor<DnDClass[]> {
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
                        catchError((err)=> {
                            console.error("Error: ", err);
                            return of(null);
                        }),
                        tap((classes)=> {
                            if (!!classes) {
                                LocalSrdDB.classes.bulkAdd(classes);
                            }
                        })
                    );
                } else {
                    return of(classes);
                }
            }),
            tap((classes) => !!classes && classes.length > 0 ? setClasses(classes) : null),
        ).subscribe();
    }

    return classes;
}
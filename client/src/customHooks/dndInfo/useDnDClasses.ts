import type { DnDClass } from "../../models/class.model";
import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, of, take, tap } from "rxjs";
import HttpClient$ from "../utility/httpClientObs";


const [classes, setClasses] = createSignal<DnDClass[]>([]);

export default function useDnDClasses(): Accessor<DnDClass[]> {

    HttpClient$.post<DnDClass[]>("/api/DnDInfo/Classes",{}).pipe(
        take(1),
        catchError((err)=>{
            console.error("Error: ", err);
            return of(null);
        }),
        tap((classes) => !!classes ? setClasses(classes) : null),
    ).subscribe();

    return classes;
}
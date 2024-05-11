import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, of, take, tap } from "rxjs";
import HttpClient$ from "../utility/httpClientObs";
import { Background } from "../../models/background.model";


const [background, setBackgrounds] = createSignal<Background[]>([]);

export default function useDnDBackgrounds(): Accessor<Background[]> {

    HttpClient$.post<Background[] | null>("/api/DnDInfo/Backgrounds",{}).pipe(
        take(1),
        catchError((err)=>{
            console.error("Error: ", err);
            return of(null);
        }),
        tap((classes) => !!classes ? setBackgrounds(classes): null),
    ).subscribe();

    return background;
}
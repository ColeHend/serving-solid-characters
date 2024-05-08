import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, tap } from "rxjs";
import HttpClient$ from "../utility/httpClientObs";
import { Background } from "../../models/background.model";


const [background, setBackgrounds] = createSignal<Background[]>([]);

export default function useDnDBackgrounds(): Accessor<Background[]> {

    HttpClient$.post<Background[]>("/api/DnDInfo/Backgrounds",{}).pipe(
        catchError((err, caught)=>{
            console.error("Error: ", err);
            return caught;
        }),
        tap((classes) => setBackgrounds(classes)),
    ).subscribe();

    return background;
}
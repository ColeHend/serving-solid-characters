import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, tap } from "rxjs";
import HttpClient$ from "../utility/httpClientObs";
import { Feat } from "../../models/feat.model";


const [feats, setFeats] = createSignal<Feat[]>([]);

export default function useDnDFeats(): Accessor<Feat[]> {

    HttpClient$.post<Feat[]>("/api/DnDInfo/Feats",{}).pipe(
        catchError((err, caught)=>{
            console.error("Error: ", err);
            return caught;
        }),
        tap((classes) => setFeats(classes)),
    ).subscribe();

    return feats;
}
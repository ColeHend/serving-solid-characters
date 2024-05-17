import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, of, take, tap } from "rxjs";
import HttpClient$ from "../../utility/httpClientObs";
import { Feat } from "../../../models/feat.model";


const [feats, setFeats] = createSignal<Feat[]>([]);

export default function useDnDFeats(): Accessor<Feat[]> {

    HttpClient$.post<Feat[]>("/api/DnDInfo/Feats",{}).pipe(
        take(1),
        catchError((err)=>{
            console.error("Error: ", err);
            return of(null);
        }),
        tap((classes) => !!classes ? setFeats(classes) : null),
    ).subscribe();

    return feats;
}
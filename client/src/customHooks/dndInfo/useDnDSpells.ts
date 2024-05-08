import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, tap } from "rxjs";
import HttpClient$ from "../utility/httpClientObs";
import { Spell } from "../../models/spell.model";


const [spells, setSpells] = createSignal<Spell[]>([]);

export default function useDnDSpells(): Accessor<Spell[]> {

    HttpClient$.post<Spell[]>("/api/DnDInfo/Spells",{}).pipe(
        catchError((err, caught)=>{
            console.error("Error: ", err);
            return caught;
        }),
        tap((classes) => setSpells(classes)),
    ).subscribe();

    return spells;
}
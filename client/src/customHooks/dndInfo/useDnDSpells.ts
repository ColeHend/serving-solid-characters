import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, of, take, tap } from "rxjs";
import HttpClient$ from "../utility/httpClientObs";
import { Spell } from "../../models/spell.model";


const [spells, setSpells] = createSignal<Spell[]>([]);

export default function useDnDSpells(): Accessor<Spell[]> {

    HttpClient$.post<Spell[]>("/api/DnDInfo/Spells",{}).pipe(
        take(1),
        catchError((err)=>{
            console.error("Error: ", err);
            return of(null);
        }),
        tap((classes) => !!classes ? setSpells(classes) : null),
    ).subscribe();

    return spells;
}
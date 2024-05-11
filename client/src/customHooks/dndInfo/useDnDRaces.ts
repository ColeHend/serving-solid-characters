import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, of, take, tap } from "rxjs";
import HttpClient$ from "../utility/httpClientObs";
import { Race } from "../../models/race.model";


const [race, setRace] = createSignal<Race[]>([]);

export default function useDnDRaces(): Accessor<Race[]> {

    HttpClient$.post<Race[]>("/api/DnDInfo/Races",{}).pipe(
        take(1),
        catchError((err)=>{
            console.error("Error: ", err);
            return of(null);
        }),
        tap((classes) => !!classes ? setRace(classes) : null),
    ).subscribe();

    return race;
}
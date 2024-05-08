import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, tap } from "rxjs";
import HttpClient$ from "../utility/httpClientObs";
import { Race } from "../../models/race.model";


const [race, setRace] = createSignal<Race[]>([]);

export default function useDnDRaces(): Accessor<Race[]> {

    HttpClient$.post<Race[]>("/api/DnDInfo/Races",{}).pipe(
        catchError((err, caught)=>{
            console.error("Error: ", err);
            return caught;
        }),
        tap((classes) => setRace(classes)),
    ).subscribe();

    return race;
}
import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, of, take, tap, concatMap } from "rxjs";
import HttpClient$ from "../../utility/httpClientObs";
import { Race } from "../../../../models/race.model";
import LocalSrdDB from "../../utility/localDB/srdDBFile";

const [race, setRace] = createSignal<Race[]>([]);

export function useDnDRaces(): Accessor<Race[]> {
  const LocalRaces = HttpClient$.toObservable(LocalSrdDB.races.toArray());
  if (race().length === 0) {
    LocalRaces.pipe(
      take(1),
      concatMap((races)=>{
        if (races.length > 0) {
          return of(races);
        } else {
          return of([]);
        }
      }),
      concatMap((races)=>{
        if (races.length === 0) {
          return HttpClient$.get<Race[]>(`/api/DnDInfo/Races`,{}).pipe(
            take(1),
            catchError((err)=>{
              console.error("Error: ", err);
              return of(null);
            }),
            tap((racess)=>{
              if (racess) {
                LocalSrdDB.races.bulkAdd(racess);
              }
            }),
          );
        } else {
          return of(races)
        }
      }),
      tap((classes) => !!classes && classes.length > 0 ? setRace(classes) : null),
    ).subscribe();
  }

  return race;
}
export default useDnDRaces;
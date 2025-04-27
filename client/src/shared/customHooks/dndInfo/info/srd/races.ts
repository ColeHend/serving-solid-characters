import { Race } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concat, concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import { createSignal } from "solid-js";

const [races, setRaces] = createSignal<Race[]>([]);

export function useGetSrdRaces(version: '2014' | '2024' = '2014') {
  const LocalRaces = HttpClient$.toObservable(SrdDB.races.toArray());

  if (races().length === 0) {
    LocalRaces.pipe(
      take(1),
      concatMap(races => {
        if (races.length > 0) {
          return of(races);
        } else {
          return of([])
        }
      }),
      concatMap((races) => {
        if (races.length === 0) {
          return fetchRaces(version);
        } else {
          return of(races);
        }
      }),
      tap((races) => !!races && races.length > 0 ? setRaces(races) : null)
    ).subscribe();
  }

  return races
};

function fetchRaces(version: '2014' | '2024' = '2014') {
  return HttpClient$.get<Race[]>(`/api/${version}/Races`).pipe(
    take(1),
    tap((races) => {
      if (races) {
        SrdDB.races.bulkAdd(races);
      }
    })
  )
}
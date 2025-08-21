import { Race } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concat, concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import { createSignal } from "solid-js";

const [races2014, setRaces2014] = createSignal<Race[]>([]);
const [races2024, setRaces2024] = createSignal<Race[]>([]);
let loading2014 = false;
let loading2024 = false;

export function useGetSrdRaces(version: '2014' | '2024' | "both" | string) {
  const LocalRaces = HttpClient$.toObservable(SrdDB.races.toArray());

  if ((version === '2014' || version === 'both') && races2014().length === 0 && !loading2014) {

  }

  if ((version === '2024' || version === 'both') && races2024().length === 0 && !loading2024) {
    
  }

  // if (races().length === 0) {
  //   LocalRaces.pipe(
  //     take(1),
  //     concatMap(races => {
  //       if (races.length > 0) {
  //         return of(races);
  //       } else {
  //         return of([])
  //       }
  //     }),
  //     concatMap((races) => {
  //       if (races.length === 0) {
  //         return fetchRaces(version);
  //       } else {
  //         return of(races);
  //       }
  //     }),
  //     tap((races) => !!races && races.length > 0 ? setRaces(races) : null)
  //   ).subscribe();
  // }

  // return races
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
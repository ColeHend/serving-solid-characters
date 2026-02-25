import { Race } from "../../../../../models/generated";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import { createMemo, createSignal } from "solid-js";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";

const [races2014, setRaces2014] = createSignal<Race[]>([]);
const [races2024, setRaces2024] = createSignal<Race[]>([]);
let loading2014 = false;
let loading2024 = false;

export function useGetSrdRaces(version: '2014' | '2024' | "both" | string) {

  if ((version === '2014' || version === 'both') && races2014().length === 0 && !loading2014) {
    loading2014 = true;
    const srdDB2014$ = HttpClient$.toObservable(SrdDB.races.toArray());  
    srdDB2014$.pipe(
      take(1),
      concatMap((cached) => {
        if (cached.length > 0) return of(cached);
        return fetchRaces("2014");
      }),
      tap(list => {
        if (list?.length) {
          SrdDB.races.bulkPut(list).catch(err => console.error('Error saving 2014 races:', err));
        }
      })
    ).subscribe({
      next: (list) => setRaces2014(list),
      error: (e) => { console.error('2014 races load error:', e) },
      complete: () => { loading2014 = false; }
    })
  }

  if ((version === '2024' || version === 'both') && races2024().length === 0 && !loading2024) {
    loading2024 = true;
    const srdDB2024$ = HttpClient$.toObservable(SrdDB2024.races.toArray());
    srdDB2024$.pipe(
      take(1),
      concatMap((cached) => {
        if (cached.length) return of(cached);
        return fetchRaces("2024");
      }),
      tap(list => {
        if (list?.length) {
          SrdDB2024.races.bulkPut(list).catch(err => console.error('Error saving 2024 races:', err));
        }
      })
    ).subscribe({
      next: (list) => setRaces2024(list),
      error: (e) => { console.error('Error saving 2024 races', e) },
      complete: () => { loading2024 = false }
    })
  }

  return createMemo<Race[]>(() => {
    if (version === "2014") return races2014();
    if (version === "2024") return races2024();
    if (version === "both") return [...races2014(),...races2024()];

    return races2014().length ? races2014() : races2024()
  })

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
// };

//   return createMemo<Race[]>(() => {
//     if (version === '2014') return races2014();
//     if (version === '2024') return races2024();
//     if (version === 'both') return [...races2014(), ...races2024()];
//     return races2014().length ? races2014() : races2024();
//   });
};

function fetchRaces(version: '2014' | '2024') {
  return HttpClient$.get<Race[]>(`/api/${version}/Races`).pipe(take(1));
}
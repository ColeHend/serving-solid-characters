import HttpClient$ from "../../../utility/tools/httpClientObs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";
import { concatMap, of, take, tap } from "rxjs";
import { createMemo, createSignal } from "solid-js";
import { Feat } from "../../../../../models/data";

const [feats, setFeats] = createSignal<Feat[]>([]);

const [feats2014, setFeats2014] = createSignal<Feat[]>([]);
const [feats2024, setFeats2024] = createSignal<Feat[]>([]);
let loading2014 = false;
let loading2024 = false;

export function useGetSrdFeats(version: '2014' | '2024' | 'both' | string) {
  
  if ((version === '2014' || version === 'both') && feats2014().length === 0 && !loading2014) {
    loading2014 = true;
    const srdDB2014$ = HttpClient$.toObservable(SrdDB.feats.toArray());
    srdDB2014$.pipe(
      take(1),
      concatMap((cached) => {
        if (cached.length > 0) return of(cached);
        return fetchFeats("2014");
      }),
      tap(list => {
        if (list?.length) {
          SrdDB.feats.bulkPut(list).catch(err => console.error('Error saving 2014 feats:', err));
        }
      })
    ).subscribe({
      next: (list) => setFeats2014(list),
      error: (e) => { console.error('2014 feats load error:', e) },
      complete: () => { loading2014 = false; }
    })
  }

  if ((version === '2024' || version === 'both') && feats2024().length === 0 && !loading2024) {
    const srdDB2024$ = HttpClient$.toObservable(SrdDB2024.feats.toArray());
    srdDB2024$.pipe(
      take(1),
      concatMap((cached) => {
        if (cached.length > 0) return of(cached);
        return fetchFeats("2024");
      }),
      tap(list => {
        if (list?.length) {
          SrdDB2024.feats.bulkPut(list).catch(err => console.error('Error saving 2024 feats:', err));
        }
      })
    ).subscribe({
      next: (list) => setFeats2024(list),
      error: (e) => { console.error('2024 feats load error', e) },
      complete: () => { loading2024 = false; }
    });
  }

  return createMemo<Feat[]>(() => {
    if (version === "2014") return feats2014();
    if (version === "2024") return feats2024();
    if (version === "both") return [...feats2014(),...feats2024()]

    return feats2014().length ? feats2014() : feats2024()
  })



  // if (feats().length === 0) {
  //   LocalFeats.pipe(
  //     take(1),
  //     concatMap((feats) => {
  //       if (feats.length > 0) {
  //         return of(feats);
  //       } else {
  //         return of([])
  //       }
  //     }),
  //     concatMap((feats) => {
  //       if (feats.length === 0) {
  //         return fetchFeats(version);
  //       } else {
  //         return of(feats);
  //       }
  //     }),
  //     tap((feats) => !!feats && feats.length > 0 ? setFeats(feats) : null),
  //   ).subscribe();
  // }


  return feats;
}

function fetchFeats(version: '2014' | '2024' ) {
  return HttpClient$.get<Feat[]>(`/api/${version}/Feats`).pipe(
    take(1),
    tap((feats) => {
      if (feats) {
        SrdDB.feats.bulkAdd(feats);
      }
    })
  )
}
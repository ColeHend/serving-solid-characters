import { Feat } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import { createSignal } from "solid-js";

const [feats, setFeats] = createSignal<Feat[]>([]);

export function useGetSrdFeats(version: '2014' | '2024' = '2014') {
  const LocalFeats = HttpClient$.toObservable(SrdDB.feats.toArray());

  if (feats().length === 0) {
    LocalFeats.pipe(
      take(1),
      concatMap((feats) => {
        if (feats.length > 0) {
          return of(feats);
        } else {
          return of([])
        }
      }),
      concatMap((feats) => {
        if (feats.length === 0) {
          return fetchFeats(version);
        } else {
          return of(feats);
        }
      }),
      tap((feats) => !!feats && feats.length > 0 ? setFeats(feats) : null),
    ).subscribe();
  }
  return feats;
}

function fetchFeats(version: '2014' | '2024' = '2014') {
  return HttpClient$.get<Feat[]>(`/api/${version}/Feats`).pipe(
    take(1),
    tap((feats) => {
      if (feats) {
        SrdDB.feats.bulkAdd(feats);
      }
    })
  )
}
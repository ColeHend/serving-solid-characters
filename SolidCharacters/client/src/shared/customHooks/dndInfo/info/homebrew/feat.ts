import { Feat } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import HombrewDB from "../../../utility/localDB/new/homebrewDB";
import { createSignal } from "solid-js";

const [feats, setFeats] = createSignal<Feat[]>([]);

export function useGetHombrewFeats() {
  const LocalFeats = HttpClient$.toObservable(HombrewDB.feats.toArray());

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
      tap((feats) => !!feats && feats.length > 0 ? setFeats(feats) : null),
    ).subscribe();
  }
  return feats;
}
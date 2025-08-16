import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, of, take, tap, concatMap, shareReplay, Observable } from "rxjs";
import HttpClient$ from "../../utility/tools/httpClientObs";
import { Feat } from "../../../../models/old/feat.model";
import LocalSrdDB from "../../utility/localDB/old/srdDBFile";

const [feats, setFeats] = createSignal<Feat[]>([]);
let featsFetch$: Observable<Feat[] | null> | undefined;

export function useDnDFeats(): Accessor<Feat[]> {
  const LocalFeats = HttpClient$.toObservable(LocalSrdDB.feats.toArray());

  if (feats().length === 0) {
    LocalFeats.pipe( 
      take(1),
      concatMap((feats) => {
        if (feats.length > 0) {
          return of(feats);
        } else {
          return of([]);
        }
      }),
      concatMap((feats) => {
        if (feats.length === 0) {
          if (!featsFetch$) {
            featsFetch$ = HttpClient$.get<Feat[]>("/api/DnDInfo/Feats", {}).pipe(
              take(1),
              catchError((err) => {
                console.error("Error: ", err);
                return of(null);
              }),
              tap((f) => {
                if (f) {
                  LocalSrdDB.feats.bulkAdd(f);
                }
              }),
              shareReplay(1)
            );
          }
          return featsFetch$;
        } else {
          return of(feats);
        }
      }),
      tap((classes) => !!classes && classes.length > 0 ? setFeats(classes) : null),
    ).subscribe();
  }

  return feats;
}
export default useDnDFeats;
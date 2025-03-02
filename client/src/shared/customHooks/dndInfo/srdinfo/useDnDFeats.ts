import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, of, take, tap, concatMap } from "rxjs";
import HttpClient$ from "../../utility/httpClientObs";
import { Feat } from "../../../../models/feat.model";
import LocalSrdDB from "../../utility/localDB/srdDBFile";

const [feats, setFeats] = createSignal<Feat[]>([]);

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
          return HttpClient$.post<Feat[]>("/api/DnDInfo/Feats", {}).pipe(
            take(1),
            catchError((err) => {
              console.error("Error: ", err);
              return of(null);
            }),
            tap((feats) => {
              if (feats) {
                LocalSrdDB.feats.bulkAdd(feats);
              }
            }),
          );
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
import { MagicItem } from "../../../../../models/generated";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import HombrewDB from "../../../utility/localDB/new/homebrewDB";
import { createSignal } from "solid-js";

const [magicItems, setMagicItems] = createSignal<MagicItem[]>([]);

export function useGetHombrewMagicItems() {
  const LocalMagicItems = HttpClient$.toObservable(HombrewDB.magicItems.toArray());

  if (magicItems().length === 0) {
    LocalMagicItems.pipe(
      take(1),
      concatMap((items) => {
        if (items.length > 0) {
          return of(items);
        } else {
          return of([])
        }
      }),
      tap((items) => !!items && items.length > 0 ? setMagicItems(items) : null),
    ).subscribe();
  }
  return magicItems;
}
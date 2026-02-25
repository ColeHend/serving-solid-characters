import { Item } from "../../../../../models/generated";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import HombrewDB from "../../../utility/localDB/new/homebrewDB";
import { createSignal } from "solid-js";

const [items, setItems] = createSignal<Item[]>([]);

export function useGetHombrewItems() {
  const LocalItems = HttpClient$.toObservable(HombrewDB.items.toArray());

  if (items().length === 0) {
    LocalItems.pipe(
      take(1),
      concatMap((items) => {
        if (items.length > 0) {
          return of(items);
        } else {
          return of([])
        }
      }),
      tap((items) => !!items && items.length > 0 ? setItems(items) : null),
    ).subscribe();
  }
  return items;
}
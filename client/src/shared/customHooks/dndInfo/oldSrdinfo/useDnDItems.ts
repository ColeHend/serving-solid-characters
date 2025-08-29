import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, of, take, tap, concatMap, shareReplay, Observable } from "rxjs";
import HttpClient$ from "../../utility/tools/httpClientObs";
import { Item } from "../../../../models/data/items";
import LocalSrdDB from "../../utility/localDB/old/srdDBFile";

const [items, setItems] = createSignal<Item[]>([]);
let itemsFetch$: Observable<Item[] | null> | undefined;

export function useDnDItems(): Accessor<Item[]> {
  const LocalItems = HttpClient$.toObservable(LocalSrdDB.items.toArray());
  if (items().length === 0) {
    LocalItems.pipe(
      take(1),
      concatMap((items) => {
        if (items.length > 0) {
          return of(items);
        } else {
          return of([]);
        }
      }),
      concatMap((items) => {
        if (items.length === 0) {
          if (!itemsFetch$) {
            itemsFetch$ = HttpClient$.get<Item[]>("/api/DnDInfo/Items", {}).pipe(
              take(1),
              catchError((err) => {
                console.error("Error: ", err);
                return of(null);
              }),
              tap((itemss) => {
                if (itemss) {
                  LocalSrdDB.items.bulkAdd(itemss);
                }
              }),
              shareReplay(1)
            );
          }
          return itemsFetch$;
        } else {
          return of(items);
        }
      }),
      tap((classes) => !!classes && classes.length > 0 ? setItems(classes) : null),
    ).subscribe();
  }

  return items;
}
export default useDnDItems;
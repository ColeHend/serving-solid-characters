import { Item } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import { createSignal } from "solid-js";

const [items, setItems] = createSignal<Item[]>([]);

export function useGetSrdItems(version: '2014' | '2024' = '2014') {
  const LocalItems = HttpClient$.toObservable(SrdDB.items.toArray());

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
      concatMap((items) => {
        if (items.length === 0) {
          return fetchItems(version);
        } else {
          return of(items);
        }
      }),
      tap((items) => !!items && items.length > 0 ? setItems(items) : null),
    ).subscribe();
  }
  return items;
}

function fetchItems(version: '2014' | '2024' = '2014') {
  return HttpClient$.get<Item[]>(`/api/${version}/Items`).pipe(
    take(1)
  )
}
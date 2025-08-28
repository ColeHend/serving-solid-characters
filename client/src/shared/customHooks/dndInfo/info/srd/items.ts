import { Item } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import { createMemo, createSignal } from "solid-js";
import SrdDB2024 from "../../../utility/localDB/new/srdDB2024";

const [items2014, setItems2014] = createSignal<Item[]>([]);
const [items2024, setItems2024] = createSignal<Item[]>([]);
let loading2014 = false;
let loading2024 = false;

export function useGetSrdItems(version: '2014' | '2024' | "both" | string) {

  if ((version === '2014' || version === 'both') && items2014().length === 0 && !loading2014) {
    loading2014 = true;
    const srdDb2014$ = HttpClient$.toObservable(SrdDB.items.toArray());
    srdDb2014$.pipe(
      take(1),
      concatMap((cached) => {
        if (cached.length > 0) return of(cached);
        return fetchItems("2014");
      }),
      tap(list => {
        if (list?.length) {
          SrdDB.items.bulkPut(list).catch(err => console.error('Error saving 2014 items:', err));
        }
      })
    ).subscribe({
      next: (list) => setItems2014(list),
      error: (e) => { console.error('2014 items load error:', e) },
      complete: () => { loading2014 = false; }
    });
  }

  if ((version === '2024' || version === 'both') && items2024().length === 0 && !loading2024) {
    loading2024 = true;
    const srdDb2024$ = HttpClient$.toObservable(SrdDB2024.items.toArray());
    srdDb2024$.pipe(
      take(1),
      concatMap((cached) => {
        if (cached.length > 0) return of(cached);
        return fetchItems("2024");
      }),
      tap(list => {
        if (list?.length) {
          SrdDB2024.items.bulkPut(list).catch(err => console.error('Error saving 2024 items:', err));
        }
      })
    ).subscribe({
      next: (list) => setItems2024(list),
      error: (e) => { console.error('2024 items load error:', e) },
      complete: () => { loading2024 = false; }
    });
  }

  return createMemo<Item[]>(() => {
    if (version === "2014") return items2014();
    if (version === "2024") return items2024();
    if (version === "both") return [...items2014(),...items2024()]
    return items2014().length ? items2014() : items2024();
  })
}

function fetchItems(version: '2014' | '2024' = '2014') {
  return HttpClient$.get<Item[]>(`/api/${version}/Items`).pipe(
    take(1),
    tap((items) => {
      if (items) {
        SrdDB.items.bulkAdd(items);
      }
    })
  )
}
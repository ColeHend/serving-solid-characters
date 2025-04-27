import { MagicItem } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concat, concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import { createSignal } from "solid-js";

const [magicItems, setMagicItems] = createSignal<MagicItem[]>([]);

export function useGetSrdMagicItems(version: '2014' | '2024' = '2014') {
  const LocalMagicItems = HttpClient$.toObservable(SrdDB.magicItems.toArray());

  if (magicItems().length === 0) {
    LocalMagicItems.pipe(
      take(1),
      concatMap(magicItems => {
        if (magicItems.length > 0) {
          return of(magicItems);
        } else {
          return of([])
        }
      }),
      concatMap((magicItems) => {
        if (magicItems.length === 0) {
          return fetchMagicItems(version);
        } else {
          return of(magicItems);
        }
      }),
      tap((magicItems) => !!magicItems && magicItems.length > 0 ? setMagicItems(magicItems) : null)
    ).subscribe();
  }
  return magicItems
};

function fetchMagicItems(version: '2014' | '2024' = '2014') {
  return HttpClient$.get<MagicItem[]>(`/api/${version}/MagicItems`).pipe(
    take(1),
  )
}
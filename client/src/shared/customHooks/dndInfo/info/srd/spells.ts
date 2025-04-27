import { Spell } from "../../../../../models/data";
import HttpClient$ from "../../../utility/tools/httpClientObs";
import { concatMap, of, take, tap } from "rxjs";
import SrdDB from "../../../utility/localDB/new/srdDB";
import { createSignal } from "solid-js";

const [spells, setSpells] = createSignal<Spell[]>([]);

export function useGetSrdSpells(version: '2014' | '2024' = '2014') {
  const LocalSpells = HttpClient$.toObservable(SrdDB.spells.toArray());

  if (spells().length === 0) {
    LocalSpells.pipe(
      take(1),
      concatMap((spells) => {
        if (spells.length > 0) {
          return of(spells);
        } else {
          return of([])
        }
      }),
      concatMap((spells) => {
        if (spells.length === 0) {
          return fetchSpells(version);
        } else {
          return of(spells);
        }
      }),
      tap((spells) => !!spells && spells.length > 0 ? setSpells(spells) : null),
    ).subscribe();
  }
  return spells;
}

function fetchSpells(version: '2014' | '2024' = '2014') {
  return HttpClient$.get<Spell[]>(`/api/${version}/Spells`).pipe(
    take(1)
  )
}
import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, combineLatest, concatMap, map, Observable, of, take, tap, shareReplay } from "rxjs";
import HttpClient$ from "../../utility/tools/httpClientObs";
import { Spell } from "../../../../models/old/spell.model";
import LocalSrdDB from "../../utility/localDB/old/srdDBFile"
import LocalHomebrewDB from "../../utility/localDB/old/homebrewDBFile";

const [spells, setSpells] = createSignal<Spell[]>([]);
let spellsFetch$: Observable<Spell[] | null> | undefined; // cached API fetch observable

export function useDnDSpells(excludeHomebrew?:boolean): Accessor<Spell[]> {
  const LocalSpells = HttpClient$.toObservable(LocalSrdDB.spells.toArray());
  const HombrewSpells = HttpClient$.toObservable(LocalHomebrewDB.spells.toArray());

  if (spells().length === 0) {
    const combinedLocal$: Observable<Spell[]> = excludeHomebrew
      ? LocalSpells
      : combineLatest([LocalSpells, HombrewSpells]).pipe(
          map(([srdSpells, homebrewSpells]) => [...srdSpells, ...homebrewSpells])
        );

    combinedLocal$
      .pipe(
        take(1),
        concatMap(local => {
          if (local.length > 0) return of(local);
          // Need remote fetch; create (or reuse) shared observable
          if (!spellsFetch$) {
            spellsFetch$ = HttpClient$
              .get<Spell[]>("/api/DnDInfo/Spells", {})
              .pipe(
                take(1),
                catchError(err => {
                  console.error("Spells fetch error:", err);
                  return of(null);
                }),
                tap(remote => {
                  if (remote) {
                    LocalSrdDB.spells.bulkAdd(remote);
                  }
                }),
                shareReplay(1)
              );
          }
          return spellsFetch$!; // may emit null
        }),
        tap(result => {
          if (result && result.length > 0) {
            setSpells(result);
          }
        })
      )
      .subscribe();
  }

  return spells;
}
export default useDnDSpells;

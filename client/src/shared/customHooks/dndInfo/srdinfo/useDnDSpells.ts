import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, combineLatest, concatMap, map, Observable, of, take, tap } from "rxjs";
import HttpClient$ from "../../utility/httpClientObs";
import { Spell } from "../../../../models/spell.model";
import LocalSrdDB from "../../utility/localDB/srdDBFile"
import LocalHomebrewDB from "../../utility/localDB/homebrewDBFile";

const [spells, setSpells] = createSignal<Spell[]>([]);

export function useDnDSpells(excludeHomebrew?:boolean): Accessor<Spell[]> {
  const LocalSpells = HttpClient$.toObservable(LocalSrdDB.spells.toArray());
  const HombrewSpells = HttpClient$.toObservable(LocalHomebrewDB.spells.toArray());

  if (spells().length === 0) {
    const allSpells$:Observable<Spell[]> = excludeHomebrew ? LocalSpells : combineLatest([LocalSpells, HombrewSpells]).pipe(
      map(([srdSpells, homebrewSpells])=>[...srdSpells, ...homebrewSpells])
    );
    allSpells$.pipe(
      take(1),
      concatMap((spells)=>{
        if (spells.length > 0) {
          return of(spells);
        } else {
          return of([])
        }
      }),
      concatMap((spells)=>{
        if (spells.length === 0) {
          return HttpClient$.post<Spell[]>("/api/DnDInfo/Spells",{}).pipe(
            take(1),
            catchError((err)=> {
              console.error("Error: ", err);
              return of(null);
            }),
            tap((spells)=> {
              if (spells) {
                LocalSrdDB.spells.bulkAdd(spells);
              }
            })
          );
        } else {
          return of(spells);
        }
      }),
      tap((classes) => !!classes && classes.length > 0 ? setSpells(classes) : null),
    ).subscribe();
  }

  return spells;
}
export default useDnDSpells;

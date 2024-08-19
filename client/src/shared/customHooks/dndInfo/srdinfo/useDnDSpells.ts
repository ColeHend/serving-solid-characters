import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, concatMap, of, take, tap } from "rxjs";
import HttpClient$ from "../../utility/httpClientObs";
import { Spell } from "../../../../models/spell.model";
import LocalSrdDB from "../../utility/localDB/srdDBFile"

const [spells, setSpells] = createSignal<Spell[]>([]);

export function useDnDSpells(): Accessor<Spell[]> {
    const LocalSpells = HttpClient$.toObservable(LocalSrdDB.spells.toArray());

    if (spells().length === 0) {
        LocalSpells.pipe(
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
                            if (!!spells) {
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

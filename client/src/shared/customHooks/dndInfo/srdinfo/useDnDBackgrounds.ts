import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, of, take, tap, concatMap } from "rxjs";
import HttpClient$ from "../../utility/httpClientObs";
import { Background } from "../../../../models/background.model";
import LocalSrdDB from "../../utility/localDB/srdDBFile";

const [background, setBackgrounds] = createSignal<Background[]>([]);

export function useDnDBackgrounds(): Accessor<Background[]> {
    const LocalBackgrounds = HttpClient$.toObservable(LocalSrdDB.backgrounds.toArray());
    if (background().length === 0) {
        LocalBackgrounds.pipe(
            take(1),
            concatMap((backgrounds) => {
                if (backgrounds.length > 0) {
                    return of(backgrounds);
                } else {
                    return of([]);
                }
            }),
            concatMap((backgrounds) => {
                if (backgrounds.length === 0) {
                    return HttpClient$.post<Background[]>("/api/DnDInfo/Backgrounds", {}).pipe(
                        take(1),
                        catchError((err) => {
                            console.error("Error: ", err);
                            return of(null);
                        }),
                        tap((backgrounds) => {
                            if (!!backgrounds) {
                                LocalSrdDB.backgrounds.bulkAdd(backgrounds);
                            }
                        }),
                    );
                } else {
                    return of(backgrounds);
                }
            }),
            tap((classes) => !!classes && classes.length > 0 ? setBackgrounds(classes) : null),
        ).subscribe();
    }

    return background;
}
export default useDnDBackgrounds;
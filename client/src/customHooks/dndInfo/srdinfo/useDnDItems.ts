import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, of, take, tap, concatMap } from "rxjs";
import HttpClient$ from "../../utility/httpClientObs";
import { Item } from "../../../models/items.model";
import LocalSrdDB from "../../utility/localDB/srdDBFile";

const [items, setItems] = createSignal<Item[]>([]);

export default function useDnDItems(): Accessor<Item[]> {
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
                    return HttpClient$.post<Item[]>("/api/DnDInfo/Items", {}).pipe(
                        take(1),
                        catchError((err) => {
                            console.error("Error: ", err);
                            return of(null);
                        }),
                        tap((itemss) => {
                            if (!!itemss) {
                                LocalSrdDB.items.bulkAdd(itemss);
                            }
                        }),
                    );
                } else {
                    return of(items);
                }
            }),
            tap((classes) => !!classes && classes.length > 0 ? setItems(classes) : null),
        ).subscribe();
    }

    return items;
}
import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, of, take, tap } from "rxjs";
import HttpClient$ from "../utility/httpClientObs";
import { Item } from "../../models/items.model";


const [items, setItems] = createSignal<Item[]>([]);

export default function useDnDItems(): Accessor<Item[]> {

    HttpClient$.post<Item[]>("/api/DnDInfo/Items",{}).pipe(
        take(1),
        catchError((err)=>{
            console.error("Error: ", err);
            return of(null);
        }),
        tap((classes) => !!classes ? setItems(classes) : null),
    ).subscribe();

    return items;
}
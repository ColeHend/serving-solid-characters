import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, tap } from "rxjs";
import HttpClient$ from "../utility/httpClientObs";
import { Item } from "../../models/items.model";


const [items, setItems] = createSignal<Item[]>([]);

export default function useDnDItems(): Accessor<Item[]> {

    HttpClient$.post<Item[]>("/api/DnDInfo/Items",{}).pipe(
        catchError((err, caught)=>{
            console.error("Error: ", err);
            return caught;
        }),
        tap((classes) => setItems(classes)),
    ).subscribe();

    return items;
}
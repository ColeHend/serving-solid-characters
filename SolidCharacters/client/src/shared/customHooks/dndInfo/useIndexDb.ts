import { Observable } from "rxjs";
import Dexie from "dexie"
import httpClient$ from "../utility/tools/httpClientObs";
import { from } from "solid-js";
interface Config {
    keyNames: ({key: string, unique: boolean})[]
}

const db = new Dexie("dndInfo")
db.version(1).stores({
  "classes": "++id, name"
})

export default function useIndexDb(table:string) {

}

const toSignal = <T>(promis:Promise<T>)=> from(httpClient$.toObservable(promis) as Observable<T>)
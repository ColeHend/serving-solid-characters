import { createMemo, createSignal } from "solid-js";
import useDnDFeats from "../dndInfo/srdinfo/useDnDFeats";
import homebrewDB from "../utility/localDB/homebrewDBFile";
import HttpClient$ from "../utility/httpClientObs";
import type { Feat } from "../../../models";
import { take, tap } from "rxjs";
const [homebrewFeats, setHomebrewFeats] = createSignal<Feat[]>([]);
const useGetFeats = () => {
    const dndSrdFeats = useDnDFeats();
    const LocalFeats = HttpClient$.toObservable(homebrewDB.feats.toArray());
    if (homebrewFeats().length === 0) {
        LocalFeats.pipe(
            take(1),
            tap((feats) => {
                if (feats.length > 0) {
                    setHomebrewFeats(feats);
                }
            })
        ).subscribe();
    }
    const allFeats = createMemo(()=>[...dndSrdFeats(), ...homebrewFeats()]);
    return allFeats;
}
export { useGetFeats };
export default useGetFeats;
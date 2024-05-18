import { createMemo } from "solid-js";
import useDnDSpells from "../dndInfo/srdinfo/useDnDSpells";

const useGetSpells = () => {
    const dndSrdSpells = useDnDSpells();
    
    const allSpells = createMemo(()=>[...dndSrdSpells()]);
    return allSpells;
}
export default useGetSpells;
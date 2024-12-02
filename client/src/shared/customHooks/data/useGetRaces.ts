import { createMemo } from "solid-js";
import useDnDRaces from "../dndInfo/srdinfo/useDnDRaces";
import homebrewManager from "../homebrewManager";

const useGetRaces = () => {
    const dndSrdRaces = useDnDRaces();
    const homebrewRaces = createMemo(()=>homebrewManager.races())

    const allRaces = createMemo(()=>[...dndSrdRaces(), ...homebrewRaces()]);
    return allRaces;
}
export default useGetRaces;
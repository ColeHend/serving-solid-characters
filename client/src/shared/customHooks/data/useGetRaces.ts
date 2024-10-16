import { createMemo } from "solid-js";
import useDnDRaces from "../dndInfo/srdinfo/useDnDRaces";
import homebrewManager from "../homebrewManager";

const useGetRaces = () => {
    const dndSrdRaces = useDnDRaces();
    
    const allRaces = createMemo(()=>[...dndSrdRaces(), ...homebrewManager.races()]);
    return allRaces;
}
export default useGetRaces;
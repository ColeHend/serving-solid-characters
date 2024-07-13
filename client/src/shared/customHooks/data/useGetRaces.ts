import { createMemo } from "solid-js";
import useDnDRaces from "../dndInfo/srdinfo/useDnDRaces";

const useGetRaces = () => {
    const dndSrdRaces = useDnDRaces();
    
    const allRaces = createMemo(()=>[...dndSrdRaces()]);
    return allRaces;
}
export default useGetRaces;
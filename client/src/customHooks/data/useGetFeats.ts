import { createMemo } from "solid-js";
import useDnDFeats from "../dndInfo/srdinfo/useDnDFeats";

const useGetFeats = () => {
    const dndSrdFeats = useDnDFeats();

    const allFeats = createMemo(()=>[...dndSrdFeats()]);
    return allFeats;
}
export default useGetFeats;
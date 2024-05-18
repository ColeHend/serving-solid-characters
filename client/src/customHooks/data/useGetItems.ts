import { createMemo } from "solid-js";
import useDnDItems from "../dndInfo/srdinfo/useDnDItems";

const useGetItems = () => {
    const dndSrdItems = useDnDItems();
    
    const allItems = createMemo(()=>[...dndSrdItems()]);
    return allItems;
}
export default useGetItems;
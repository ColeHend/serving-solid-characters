import { createMemo } from "solid-js";
import useDnDClasses from "../dndInfo/srdinfo/useDnDClasses";

const useGetClasses = () => {
    const dndSrdClasses = useDnDClasses();
    
    const allClasses = createMemo(()=>[...dndSrdClasses()]);
    return allClasses;
}
export default useGetClasses;
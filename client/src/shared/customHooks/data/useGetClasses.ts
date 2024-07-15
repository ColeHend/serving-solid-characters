import { createMemo } from "solid-js";
import useDnDClasses from "../dndInfo/srdinfo/useDnDClasses";
import HomebrewManager from "../../../shared/customHooks/homebrewManager";
const useGetClasses = () => {
    const dndSrdClasses = useDnDClasses();
    
    const allClasses = createMemo(()=>[...dndSrdClasses(), ...HomebrewManager.classes()]);
    return allClasses;
}
export default useGetClasses;
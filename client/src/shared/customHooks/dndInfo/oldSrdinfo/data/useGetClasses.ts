import { createMemo } from "solid-js";
import useDnDClasses from "../useDnDClasses";
import HomebrewManager from "../../../homebrewManager";
const useGetClasses = () => {
  const dndSrdClasses = useDnDClasses();
    
  const allClasses = createMemo(()=>[...dndSrdClasses(), ...HomebrewManager.classes()]);
  return allClasses;
}
export { useGetClasses };
export default useGetClasses;
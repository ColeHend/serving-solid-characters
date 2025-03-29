import { createMemo } from "solid-js";
import useDnDItems from "../dndInfo/srdinfo/useDnDItems";
import { Armor, Weapon } from "../..";

const useGetItems = () => {
  const dndSrdItems = useDnDItems();
    
  const allItems = createMemo(()=>[...dndSrdItems()]);
  return allItems;
};

const useGetWeapons = () =>{
  const allItems = useGetItems();
  return createMemo(()=>allItems().filter((item)=>item.equipmentCategory === "Weapon") as Weapon[]);
};

const useGetArmor = () =>{
  const allItems = useGetItems();
  return createMemo(()=>allItems().filter((item)=>item.equipmentCategory === "Armor") as Armor[]);
};
export { useGetItems, useGetWeapons, useGetArmor };
export default useGetItems;
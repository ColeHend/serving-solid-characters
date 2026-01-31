import { useGetSrdSubclasses } from "../srd/subclasses";
import { useGetHombrewSubclasses } from "../homebrew/subclasses";
import { Subclass } from "../../../../../models/data";
import { Accessor, createMemo } from "solid-js";
import { getUserSettings } from "../../../userSettings";



export function useDnDSubclasses(): Accessor<Subclass[]> {
  const [userSettings] = getUserSettings();
  const homebrew = useGetHombrewSubclasses();
  
  return createMemo<Subclass[]>(() => {
    const active = (userSettings().dndSystem|| "2014");
    const srd = useGetSrdSubclasses(active);
        
    return [...srd(), ...homebrew()];
  });
}
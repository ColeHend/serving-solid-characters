import { useGetSrdSubclasses } from "../srd/subclasses";
import { useGetHombrewSubclasses } from "../homebrew/subclasses";
import { Subclass } from "../../../../../models/generated";
import { Accessor, createMemo } from "solid-js";
import { getUserSettings } from "../../../userSettings";

type settings = {
  overrideVersion: string;
}

export function useDnDSubclasses(settings: settings): Accessor<Subclass[]> {
  const [userSettings] = getUserSettings();
  const homebrew = useGetHombrewSubclasses();
  
  return createMemo<Subclass[]>(() => {
    const active = ( settings ? settings.overrideVersion : userSettings().dndSystem|| "2014");
    const srd = useGetSrdSubclasses(active);
        
    return [...srd(), ...homebrew()];
  });
}
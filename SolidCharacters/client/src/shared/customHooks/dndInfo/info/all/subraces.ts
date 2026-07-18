import { useGetSrdSubraces } from "../srd/subraces";
import { useGetHombrewSubraces } from "../homebrew/subraces";
import { markHomebrew } from "../provenance";
import { Subrace } from "../../../../../models/generated";
import { Accessor, createMemo } from "solid-js";
import { getUserSettings } from "../../../userSettings";

type settings = {
  overrideVersion: string;
}

export function useDnDSubraces(settings?: settings): Accessor<Subrace[]> {
  const [userSettings] = getUserSettings();
  const homebrew = useGetHombrewSubraces();

  return createMemo<Subrace[]>(() => {
    const active = (settings ? settings.overrideVersion : userSettings().dndSystem || "2014");
    const srd = useGetSrdSubraces(active);
    
    return [...srd(), ...markHomebrew(homebrew())];
  });
}
import { useGetSrdRaces } from "../srd/races";
import { useGetHombrewRaces } from "../homebrew/races";
import { markHomebrew } from "../provenance";
import { createMemo } from "solid-js";
import getUserSettings from "../../../userSettings";

export function useDnDRaces() {
  const HombrewRaces = useGetHombrewRaces();
  const [userSettings] = getUserSettings();
  
  return createMemo(() => {
    const version = userSettings().dndSystem || '2014';
    const LocalRaces = useGetSrdRaces(version);

    return  [...LocalRaces(), ...markHomebrew(HombrewRaces())]
  });
}
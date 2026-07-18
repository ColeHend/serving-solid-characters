import { useGetSrdSpells } from "../srd/spells";
import { useGetHombrewSpells } from "../homebrew/spells";
import { markHomebrew } from "../provenance";
import { createMemo } from "solid-js";
import { getUserSettings } from "../../../userSettings";

export function useDnDSpells() {
  const [userSettings] = getUserSettings();
  const homebrew = useGetHombrewSpells();

  
  // Return unified list reactively by version + homebrew changes
  return createMemo(() => {
    const version = userSettings().dndSystem || '2014';
    const srd = useGetSrdSpells(version); // returns accessor dependent on version
    const theSRD = srd();
    const theHomebrew = homebrew()
    
    return [...theSRD, ...markHomebrew(theHomebrew)];
  });
}
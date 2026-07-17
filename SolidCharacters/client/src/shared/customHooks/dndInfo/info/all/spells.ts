import { useGetSrdSpells } from "../srd/spells";
import { useGetHombrewSpells } from "../homebrew/spells";
import { createMemo } from "solid-js";
import { getUserSettings } from "../../../userSettings";

type settings = {
  overrideVersion: string;
}

export function useDnDSpells(settings?: settings) {
  const [userSettings] = getUserSettings();
  const homebrew = useGetHombrewSpells();


  // Return unified list reactively by version + homebrew changes
  return createMemo(() => {
    const version = settings ? settings.overrideVersion : userSettings().dndSystem || '2014';
    const srd = useGetSrdSpells(version); // returns accessor dependent on version
    const theSRD = srd();
    const theHomebrew = homebrew()
    
    return [...theSRD, ...theHomebrew];
  });
}
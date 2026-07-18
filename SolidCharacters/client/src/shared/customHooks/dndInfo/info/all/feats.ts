import { useGetSrdFeats } from "../srd/feats";
import { useGetHombrewFeats } from "../homebrew/feat";
import { markHomebrew } from "../provenance";
import { createMemo } from "solid-js";
import getUserSettings from "../../../userSettings";

export function useDnDFeats() {
  const [userSettings] = getUserSettings();
  const HombrewFeats = useGetHombrewFeats();
  
  return createMemo(() => {
    const version = userSettings().dndSystem || '2014';
    const srd = useGetSrdFeats(version);

    return [...srd(), ...markHomebrew(HombrewFeats())]
  });
}
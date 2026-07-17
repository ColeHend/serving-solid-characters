import { useGetSrdFeats } from "../srd/feats";
import { useGetHombrewFeats } from "../homebrew/feat";
import { createMemo } from "solid-js";
import getUserSettings from "../../../userSettings";

type settings = {
  overrideVersion: string;
}

export function useDnDFeats(settings?: settings) {
  const [userSettings] = getUserSettings();
  const HombrewFeats = useGetHombrewFeats();

  return createMemo(() => {
    const version = settings ? settings.overrideVersion : userSettings().dndSystem || '2014';
    const srd = useGetSrdFeats(version);

    return [...srd(), ...HombrewFeats()]
  });
}
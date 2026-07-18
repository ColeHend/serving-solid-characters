import { useGetSrdRaces } from "../srd/races";
import { useGetHombrewRaces } from "../homebrew/races";
import { markHomebrew } from "../provenance";
import { createMemo } from "solid-js";
import getUserSettings from "../../../userSettings";

type settings = {
  overrideVersion: string;
}

export function useDnDRaces(settings?: settings) {
  const HombrewRaces = useGetHombrewRaces();
  const [userSettings] = getUserSettings();

  return createMemo(() => {
    const version = settings ? settings.overrideVersion : userSettings().dndSystem || '2014';
    const LocalRaces = useGetSrdRaces(version);

    return  [...LocalRaces(), ...markHomebrew(HombrewRaces())]
  });
}
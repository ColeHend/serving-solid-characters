import { useGetSrdBackgrounds } from "../srd/backgrounds";
import { useGetHombrewBackgrounds } from "../homebrew/background";
import { markHomebrew } from "../provenance";
import { createMemo } from "solid-js";
import getUserSettings from "../../../userSettings";

type settings = {
  overrideVersion: string;
}

export function useDnDBackgrounds(settings?: settings) {
  const [userSettings] = getUserSettings();
  const HombrewBackgrounds = useGetHombrewBackgrounds();


  return createMemo(() => {
    const version = settings ? settings.overrideVersion : userSettings().dndSystem || '2014';
    const srd = useGetSrdBackgrounds(version);

    return [...srd(), ...markHomebrew(HombrewBackgrounds())];
  });
}
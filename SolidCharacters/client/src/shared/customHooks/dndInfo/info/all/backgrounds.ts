import { useGetSrdBackgrounds } from "../srd/backgrounds";
import { useGetHombrewBackgrounds } from "../homebrew/background";
import { createMemo } from "solid-js";
import getUserSettings from "../../../userSettings";

export function useDnDBackgrounds() {
  const [userSettings] = getUserSettings();
  const HombrewBackgrounds = useGetHombrewBackgrounds();
  

  return createMemo(() => {
    const version = userSettings().dndSystem || '2014';
    const srd = useGetSrdBackgrounds(version);

    return [...srd(), ...HombrewBackgrounds()];
  });
}
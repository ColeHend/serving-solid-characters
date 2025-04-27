import { useGetSrdBackgrounds } from "../srd/backgrounds";
import { useGetHombrewBackgrounds } from "../homebrew/background";
import { createMemo } from "solid-js";

export function useDnDBackgrounds() {
  const LocalBackgrounds = useGetSrdBackgrounds();
  const HombrewBackgrounds = useGetHombrewBackgrounds();

  return createMemo(() => [...LocalBackgrounds(), ...HombrewBackgrounds()]);
}
import { useGetSrdMasteries } from "../srd/masteries";
import { useGetHombrewWeaponMastery } from "../homebrew/masteries";
import { createMemo } from "solid-js";

export function useDnDMasteries() {
  const LocalMasteries = useGetSrdMasteries();
  const HombrewMasteries = useGetHombrewWeaponMastery();

  return createMemo(() => [...LocalMasteries(), ...HombrewMasteries()]);
}

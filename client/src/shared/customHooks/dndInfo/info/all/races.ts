import { useGetSrdRaces } from "../srd/races";
import { useGetHombrewRaces } from "../homebrew/races";
import { createMemo } from "solid-js";

export function useDnDRaces() {
  const LocalRaces = useGetSrdRaces();
  const HombrewRaces = useGetHombrewRaces();

  return createMemo(() => [...LocalRaces(), ...HombrewRaces()]);
}
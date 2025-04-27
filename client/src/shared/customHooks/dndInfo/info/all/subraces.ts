import { useGetSrdSubraces } from "../srd/subraces";
import { useGetHombrewSubraces } from "../homebrew/subraces";
import { createMemo } from "solid-js";

export function useDnDSubraces() {
  const LocalSubraces = useGetSrdSubraces();
  const HombrewSubraces = useGetHombrewSubraces();

  return createMemo(() => [...LocalSubraces(), ...HombrewSubraces()]);
}
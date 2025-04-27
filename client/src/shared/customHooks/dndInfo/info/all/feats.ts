import { useGetSrdFeats } from "../srd/feats";
import { useGetHombrewFeats } from "../homebrew/feat";
import { createMemo } from "solid-js";

export function useDnDFeats() {
  const LocalFeats = useGetSrdFeats();
  const HombrewFeats = useGetHombrewFeats();

  return createMemo(() => [...LocalFeats(), ...HombrewFeats()]);
}
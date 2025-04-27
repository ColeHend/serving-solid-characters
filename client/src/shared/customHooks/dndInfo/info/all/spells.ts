import { useGetSrdSpells } from "../srd/spells";
import { useGetHombrewSpells } from "../homebrew/spells";
import { createMemo } from "solid-js";

export function useDnDSpells() {
  const LocalSpells = useGetSrdSpells();
  const HombrewSpells = useGetHombrewSpells();

  return createMemo(() => [...LocalSpells(), ...HombrewSpells()]);
}
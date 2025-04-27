import { useGetSrdMagicItems } from "../srd/magicItems";
import { useGetHombrewMagicItems } from "../homebrew/magicItem";
import { createMemo } from "solid-js";

export function useDnDMagicItems() {
  const LocalMagicItems = useGetSrdMagicItems();
  const HombrewMagicItems = useGetHombrewMagicItems();

  return createMemo(() => [...LocalMagicItems(), ...HombrewMagicItems()]);
}
import { useGetSrdItems } from "../srd/items";
import { useGetHombrewItems } from "../homebrew/items";
import { createMemo } from "solid-js";

export function useDnDItems() {
  const LocalItems = useGetSrdItems();
  const HombrewItems = useGetHombrewItems();

  return createMemo(() => [...LocalItems(), ...HombrewItems()]);
}
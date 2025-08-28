import { useGetSrdItems } from "../srd/items";
import { useGetHombrewItems } from "../homebrew/items";
import { createMemo } from "solid-js";
import getUserSettings from "../../../userSettings";

export function useDnDItems() {
  const HombrewItems = useGetHombrewItems();
  const [userSettings] = getUserSettings();

  return createMemo(() => {
    const version = userSettings().dndSystem || '2014';
    const srd = useGetSrdItems(version);

    return [...srd(),...HombrewItems()];
  });
}
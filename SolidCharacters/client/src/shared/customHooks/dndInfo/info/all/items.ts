import { useGetSrdItems } from "../srd/items";
import { useGetHombrewItems } from "../homebrew/items";
import { createMemo } from "solid-js";
import getUserSettings from "../../../userSettings";

type settings = {
  overrideVersion: string;
}

export function useDnDItems(settings?: settings) {
  const HombrewItems = useGetHombrewItems();
  const [userSettings] = getUserSettings();

  return createMemo(() => {
    const version = settings ? settings.overrideVersion : userSettings().dndSystem || '2014';
    const srd = useGetSrdItems(version);

    return [...srd(),...HombrewItems()];
  });
}
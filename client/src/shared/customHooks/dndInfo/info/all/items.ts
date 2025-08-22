import { useGetSrdItems } from "../srd/items";
import { useGetHombrewItems } from "../homebrew/items";
import { Item } from "../../../../../models/data";
import { Accessor, createMemo } from "solid-js";
import { getUserSettings } from "../../../userSettings";

type Year = "2014" | "2024";
interface UseDnDItemsOptions { overrideVersion?: Year }

export function useDnDItems(opts?: UseDnDItemsOptions): Accessor<Item[]> {
  const [userSettings] = getUserSettings();
  return createMemo<Item[]>(() => {
    const active: Year = (opts?.overrideVersion || (userSettings().dndSystem as Year) || "2014");
    const srd = useGetSrdItems(active);
    const homebrew = useGetHombrewItems();
    return [...srd(), ...homebrew()];
  });
}
import { useGetSrdMagicItems } from "../srd/magicItems";
import { useGetHombrewMagicItems } from "../homebrew/magicItem";
import { MagicItem } from "../../../../../models/generated";
import { Accessor, createMemo } from "solid-js";
import { getUserSettings } from "../../../userSettings";

type Year = "2014" | "2024";
interface UseDnDMagicItemsOptions { overrideVersion?: Year }

export function useDnDMagicItems(opts?: UseDnDMagicItemsOptions): Accessor<MagicItem[]> {
  const [userSettings] = getUserSettings();
  return createMemo<MagicItem[]>(() => {
    const active: Year = (opts?.overrideVersion || (userSettings().dndSystem as Year) || "2014");
    const srd = useGetSrdMagicItems(active);
    const homebrew = useGetHombrewMagicItems();
    return [...srd(), ...homebrew()];
  });
}
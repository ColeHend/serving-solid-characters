import { useGetSrdFeats } from "../srd/feats";
import { useGetHombrewFeats } from "../homebrew/feat";
import { Feat } from "../../../../../models/data";
import { Accessor, createMemo } from "solid-js";
import { getUserSettings } from "../../../userSettings";

type Year = "2014" | "2024";
interface UseDnDFeatsOptions { overrideVersion?: Year }

export function useDnDFeats(opts?: UseDnDFeatsOptions): Accessor<Feat[]> {
  const [userSettings] = getUserSettings();
  return createMemo<Feat[]>(() => {
    const active: Year = (opts?.overrideVersion || (userSettings().dndSystem as Year) || "2014");
    const srd = useGetSrdFeats(active);
    const homebrew = useGetHombrewFeats();
    return [...srd(), ...homebrew()];
  });
}
import { useGetSrdSubraces } from "../srd/subraces";
import { useGetHombrewSubraces } from "../homebrew/subraces";
import { Subrace } from "../../../../../models/data";
import { Accessor, createMemo } from "solid-js";
import { getUserSettings } from "../../../userSettings";

type Year = "2014" | "2024";
interface UseDnDSubracesOptions { overrideVersion?: Year }

export function useDnDSubraces(opts?: UseDnDSubracesOptions): Accessor<Subrace[]> {
  const [userSettings] = getUserSettings();
  return createMemo<Subrace[]>(() => {
    const active: Year = (opts?.overrideVersion || (userSettings().dndSystem as Year) || "2014");
    const srd = useGetSrdSubraces(active);
    const homebrew = useGetHombrewSubraces();
    return [...srd(), ...homebrew()];
  });
}
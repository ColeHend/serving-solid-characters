import { useGetSrdRaces } from "../srd/races";
import { useGetHombrewRaces } from "../homebrew/races";
import { Race } from "../../../../../models/data";
import { Accessor, createMemo } from "solid-js";
import { getUserSettings } from "../../../userSettings";

type Year = "2014" | "2024";
interface UseDnDRacesOptions { overrideVersion?: Year }

export function useDnDRaces(opts?: UseDnDRacesOptions): Accessor<Race[]> {
  const [userSettings] = getUserSettings();
  return createMemo<Race[]>(() => {
    const active: Year = (opts?.overrideVersion || (userSettings().dndSystem as Year) || "2014");
    const srd = useGetSrdRaces(active);
    const homebrew = useGetHombrewRaces();
    return [...srd(), ...homebrew()];
  });
}
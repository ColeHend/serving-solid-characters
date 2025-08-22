import { useGetSrdBackgrounds } from "../srd/backgrounds";
import { useGetHombrewBackgrounds } from "../homebrew/background";
import { Background } from "../../../../../models/data";
import { Accessor, createMemo } from "solid-js";
import { getUserSettings } from "../../../userSettings";

type Year = "2014" | "2024";
interface UseDnDBackgroundsOptions { overrideVersion?: Year }

export function useDnDBackgrounds(opts?: UseDnDBackgroundsOptions): Accessor<Background[]> {
  const [userSettings] = getUserSettings();
  return createMemo<Background[]>(() => {
    const active: Year = (opts?.overrideVersion || (userSettings().dndSystem as Year) || "2014");
    const srd = useGetSrdBackgrounds(active);
    const homebrew = useGetHombrewBackgrounds();
    return [...srd(), ...homebrew()];
  });
}
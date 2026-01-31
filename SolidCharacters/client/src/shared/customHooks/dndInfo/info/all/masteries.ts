import { useGetSrdMasteries } from "../srd/masteries";
import { useGetHombrewWeaponMastery } from "../homebrew/masteries";
import { WeaponMastery } from "../../../../../models/data";
import { Accessor, createMemo } from "solid-js";
import { getUserSettings } from "../../../userSettings";

type Year = "2014" | "2024";
interface UseDnDMasteriesOptions { overrideVersion?: Year }

export function useDnDMasteries(opts?: UseDnDMasteriesOptions): Accessor<WeaponMastery[]> {
  const [userSettings] = getUserSettings();
  return createMemo<WeaponMastery[]>(() => {
    // Masteries only exist in 2024 currently; honor override for future-proofing
    const active: Year = (opts?.overrideVersion || (userSettings().dndSystem as Year) || "2024");
    const srd = useGetSrdMasteries(active);
    const homebrew = useGetHombrewWeaponMastery();
    return [...srd(), ...homebrew()];
  });
}

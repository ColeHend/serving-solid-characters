import { useGetSrdSubclasses } from "../srd/subclasses";
import { useGetHombrewSubclasses } from "../homebrew/subclasses";
import { Subclass } from "../../../../../models/data";
import { Accessor, createMemo } from "solid-js";
import { getUserSettings } from "../../../userSettings";

type Year = "2014" | "2024";
interface UseDnDSubclassesOptions { overrideVersion?: Year; }

export function useDnDSubclasses(opts?: UseDnDSubclassesOptions): Accessor<Subclass[]> {
  const [userSettings] = getUserSettings();
  return createMemo<Subclass[]>(() => {
    const active: Year = (opts?.overrideVersion || (userSettings().dndSystem as Year) || "2014");
    const srd = useGetSrdSubclasses(active);
    const homebrew = useGetHombrewSubclasses();
    return [...srd(), ...homebrew()];
  });
}
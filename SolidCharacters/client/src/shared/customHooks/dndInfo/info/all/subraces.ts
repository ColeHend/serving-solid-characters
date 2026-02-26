import { useGetSrdSubraces } from "../srd/subraces";
import { useGetHombrewSubraces } from "../homebrew/subraces";
import { Subrace } from "../../../../../models/generated";
import { Accessor, createMemo } from "solid-js";
import { getUserSettings } from "../../../userSettings";

type Year = "2014" | "2024";
interface UseDnDSubracesOptions { overrideVersion?: Year }

export function useDnDSubraces(): Accessor<Subrace[]> {
  const [userSettings] = getUserSettings();
  const homebrew = useGetHombrewSubraces();
  
  return createMemo<Subrace[]>(() => {
    const active = (userSettings().dndSystem || "2014");
    const srd = useGetSrdSubraces(active);
    
    return [...srd(), ...homebrew()];
  });
}
import { useGetSrdClasses } from "../srd/classes";
import { useGetHombrewClasses } from "../homebrew/classes";
import { Class5E } from "../../../../../models/data";
import { Accessor, createMemo } from "solid-js";
import { getUserSettings } from "../../../userSettings";

type Year = "2014" | "2024";
interface UseDnDClassesOptions { overrideVersion?: Year; }

// Auto-versioning hook: derives active SRD year from user settings unless overridden.
export function useDnDClasses(opts?: UseDnDClassesOptions): Accessor<Class5E[]> {
  const [userSettings] = getUserSettings();
  // Reactive SRD dataset accessor chosen by version
  return createMemo<Class5E[]>(() => {
    const active: Year = (opts?.overrideVersion || (userSettings().dndSystem as Year) || "2014");
    const srd = useGetSrdClasses(active); // accessor bound to active version
    const homebrew = useGetHombrewClasses();
    return [...srd(), ...homebrew()];
  });
}
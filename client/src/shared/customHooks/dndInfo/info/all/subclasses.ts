import { useGetSrdSubclasses } from "../srd/subclasses";
import { useGetHombrewSubclasses } from "../homebrew/subclasses";
import { createMemo } from "solid-js";

export function useDnDSubclasses(version: "2014" | "2024" = "2014") {
  const LocalSubclasses = useGetSrdSubclasses(version);
  const HombrewSubclasses = useGetHombrewSubclasses();

  return createMemo(() => [...LocalSubclasses(), ...HombrewSubclasses()]);
}
import { useGetSrdClasses } from "../srd/classes";
import { useGetHombrewClasses } from "../homebrew/classes";
import { Class5E } from "../../../../../models/data";
import { createMemo } from "solid-js";

export function useDnDClasses(version: "2014" | "2024" = "2014") {
  const LocalClasses = useGetSrdClasses(version);
  const HombrewClasses = useGetHombrewClasses();

  return createMemo(() => [...LocalClasses(), ...HombrewClasses()]);
}
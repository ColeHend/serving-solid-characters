import { useGetSrdClasses } from "../srd/classes";
import { useGetHombrewClasses } from "../homebrew/classes";
import { Class5E } from "../../../../../models/data";
import { createMemo } from "solid-js";
import getUserSettings from "../../../userSettings";

export function useDnDClasses() {
  const [userSettings] = getUserSettings();
  const HombrewClasses = useGetHombrewClasses();

  return createMemo(() => {
    const version = userSettings().dndSystem || '2014';
    const srd = useGetSrdClasses(version);

    return [...srd(), ...HombrewClasses()]
  });
}
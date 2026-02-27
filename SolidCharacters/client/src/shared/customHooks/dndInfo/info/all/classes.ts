import { useGetSrdClasses } from "../srd/classes";
import { useGetHombrewClasses } from "../homebrew/classes";
import { createMemo } from "solid-js";
import getUserSettings from "../../../userSettings";

type settings = { 
  overrideVersion: string;
}

export function useDnDClasses(settings?: settings) {
  const [userSettings] = getUserSettings();
  const HombrewClasses = useGetHombrewClasses();

  return createMemo(() => {
    const version = settings ? settings.overrideVersion : userSettings().dndSystem || '2014';
    const srd = useGetSrdClasses(version);
    

    return [...srd(), ...HombrewClasses()]
  });
}
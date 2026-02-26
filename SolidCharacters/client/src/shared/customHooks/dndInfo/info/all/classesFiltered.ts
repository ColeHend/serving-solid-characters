import { createMemo } from "solid-js";
import { useDnDClasses } from "./classes";
import { getUserSettings } from "../../../userSettings";
import type { Class5E } from "../../../../../models/generated";

type Year = '2014' | '2024';
interface ClassWithEdition extends Class5E { edition: Year }

// Provides edition-aware SRD classes respecting userSettings dndSystem which may be 'both'.
export function useDnDClassesFiltered() {
  const [userSettings] = getUserSettings();
  const classes2014 = useDnDClasses({ overrideVersion: '2014' });
  const classes2024 = useDnDClasses({ overrideVersion: '2024' });

  return createMemo<ClassWithEdition[]>(() => {
    const mode = userSettings().dndSystem as Year | 'both' | undefined;
    if (mode === '2014') return classes2014().map(c => ({ ...c, edition: '2014' }));
    if (mode === '2024') return classes2024().map(c => ({ ...c, edition: '2024' }));
    // both or undefined -> merge; keep ordering stable (2014 first then 2024)
    const map: ClassWithEdition[] = [];
  map.push(...classes2014().map(c => ({ ...c, edition: '2014' as Year })));
  map.push(...classes2024().map(c => ({ ...c, edition: '2024' as Year })));
    return map;
  });
}

export type { ClassWithEdition };

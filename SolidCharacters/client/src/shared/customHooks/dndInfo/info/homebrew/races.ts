import { Race } from "../../../../../models/generated";
import { Accessor } from "solid-js";
import homebrewManager from "../../../homebrewManager";

// Live signal — reflects homebrewManager race mutations in the same session
// (the old one-shot Dexie snapshot went stale until reload). The manager's accessor is
// loosely typed (any[]); this hook keeps the typed contract consumers rely on.
export function useGetHombrewRaces(): Accessor<Race[]> {
  return homebrewManager.races as Accessor<Race[]>;
}

import { Feat } from "../../../../../models/generated";
import { Accessor } from "solid-js";
import homebrewManager from "../../../homebrewManager";

// Live signal — reflects homebrewManager feat mutations in the same session
// (the old one-shot Dexie snapshot went stale until reload). The manager's accessor is
// loosely typed (any[]); this hook keeps the typed contract consumers rely on.
export function useGetHombrewFeats(): Accessor<Feat[]> {
  return homebrewManager.feats as Accessor<Feat[]>;
}

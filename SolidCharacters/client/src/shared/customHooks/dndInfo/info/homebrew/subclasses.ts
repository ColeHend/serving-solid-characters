import homebrewManager from "../../../homebrewManager";

// Live signal — reflects homebrewManager.addSubclass/updateSubclass in the same
// session (the old one-shot Dexie snapshot went stale until reload).
export function useGetHombrewSubclasses() { return homebrewManager.subclasses; }

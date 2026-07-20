import homebrewManager from "../../../homebrewManager";

// Live signal — reflects homebrewManager subrace mutations in the same session
// (the old one-shot Dexie snapshot went stale until reload).
export function useGetHombrewSubraces() { return homebrewManager.subraces; }

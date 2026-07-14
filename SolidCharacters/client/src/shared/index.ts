export * from "./components";
export * from "./customHooks";
export * from "../models/generated/SolidCharacters.Domain.DTO.Updated";
export * from "../shared/components/index";
export * from "../shared/constants/homebrew"
// `Stats` is declared both in useCharacters (via ./customHooks) and the generated DTO (Monster.stats
// pulled `Stats` into the generated barrel). They're structurally identical (str..cha); pin the barrel's
// `Stats` to the long-standing useCharacters source so existing `import { Stats } from "shared"` call
// sites keep resolving exactly as before and the two star-exports no longer collide (TS2308).
export type { Stats } from "./customHooks/dndInfo/useCharacters";
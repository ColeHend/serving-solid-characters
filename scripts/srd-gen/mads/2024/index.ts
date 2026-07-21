import type { MadMap, OptionsMap } from "../spec.ts";
import { map as classes } from "./classes.ts";
import { map as subclasses } from "./subclasses.ts";
import { map as races } from "./races.ts";
import { map as backgrounds } from "./backgrounds.ts";
import { map as feats } from "./feats.ts";
import { map as magicItems } from "./magicItems.ts";
import { optionsMap as invocations } from "./invocations.ts";

export const featureMap: MadMap = { ...classes, ...subclasses, ...races, ...backgrounds, ...feats };
export const magicItemMap: MadMap = { ...magicItems };
export const optionsMap: OptionsMap = { ...invocations };

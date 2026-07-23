/* eslint-disable @typescript-eslint/no-explicit-any */
import { Trade } from "../../../../models/trade.model";
import { Category } from "../Exporting";

export const isInExport = (key: keyof Trade, item: any, exportObject: Trade): boolean =>
    (exportObject[key] as any[]).some((x) => itemName(key, x) === itemName(key, item));

// Feats carry their name under `details.name`; everything else uses `name`.
// One accessor for both the label and the dedupe comparator keeps them in sync.
export const itemName = (key: keyof Trade, item: any): string =>
key === "feats" ? item?.details?.name ?? "" : item?.name ?? "";

export const availableItems = (cat: Category, exportObject: Trade) => cat.source().filter((i) => !isInExport(cat.key, i, exportObject));

export const activeItems = (cat: Category, exportObject: Trade) => exportObject[cat.key] as any[];
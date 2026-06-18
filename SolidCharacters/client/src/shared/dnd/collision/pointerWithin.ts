import { containsPoint } from "../geometry";
import type { CollisionDetector } from "./types";

/**
 * Picks the droppable whose rect contains the pointer. Falls back to null when
 * the pointer is outside every candidate. For pointer/touch sensors only;
 * keyboard sensors (pointer === null) should use a center-based strategy.
 */
export const pointerWithin: CollisionDetector = ({ pointer, candidates }) => {
  if (!pointer) return null;
  for (const c of candidates) {
    if (containsPoint(c.rect, pointer)) return c.id;
  }
  return null;
};

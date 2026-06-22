import { center } from "../geometry";
import type { CollisionDetector } from "./types";

/**
 * Picks the droppable whose center is nearest the active item's center.
 * The default strategy: covers the large majority of sortable/board use cases.
 */
export const closestCenter: CollisionDetector = ({ activeRect, candidates }) => {
  const activeCenter = center(activeRect);
  let bestId = null as ReturnType<CollisionDetector>;
  let bestDistSq = Infinity;
  for (const c of candidates) {
    const candidateCenter = center(c.rect);
    const dx = activeCenter.x - candidateCenter.x;
    const dy = activeCenter.y - candidateCenter.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestId = c.id;
    }
  }
  return bestId;
};

import { center } from "../geometry";
import type { Coord, Id } from "../types";
import type { CollisionEntry } from "./types";

export type Direction = "up" | "down" | "left" | "right";

/**
 * Keyboard collision model (discrete, directional). Given the current
 * reference point and an arrow direction, returns the nearest candidate that
 * lies in that direction. This is intentionally distinct from pointer collision
 * because keyboard movement is stepwise, not continuous.
 */
export function directionalNext(
  from: Coord,
  direction: Direction,
  candidates: CollisionEntry[],
): Id | null {
  let bestId: Id | null = null;
  let bestScore = Infinity;
  for (const c of candidates) {
    const p = center(c.rect);
    const dx = p.x - from.x;
    const dy = p.y - from.y;
    const inDirection =
      (direction === "up" && dy < -1) ||
      (direction === "down" && dy > 1) ||
      (direction === "left" && dx < -1) ||
      (direction === "right" && dx > 1);
    if (!inDirection) continue;
    // Primary cost: distance along the axis of travel; secondary: cross-axis drift.
    const along = direction === "up" || direction === "down" ? Math.abs(dy) : Math.abs(dx);
    const across = direction === "up" || direction === "down" ? Math.abs(dx) : Math.abs(dy);
    const score = along + across * 2;
    if (score < bestScore) {
      bestScore = score;
      bestId = c.id;
    }
  }
  return bestId;
}

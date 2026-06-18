import type { Coord, Id, Rect } from "../types";

/** A droppable candidate considered during collision detection. */
export interface CollisionEntry {
  id: Id;
  /** Cached rect (measured at drag start, invalidated on scroll/resize). */
  rect: Rect;
}

/** Context handed to a collision detector on every evaluation. */
export interface CollisionContext {
  /** The (possibly modifier-constrained) rect of the active item. */
  activeRect: Rect;
  /** The current pointer position, or null for non-pointer (keyboard) sensors. */
  pointer: Coord | null;
  /** All droppable candidates that currently accept the active item. */
  candidates: CollisionEntry[];
}

/**
 * A collision strategy. Returns the id of the best droppable, or null.
 * Strategies are pure functions of the context and are fully replaceable.
 */
export type CollisionDetector = (ctx: CollisionContext) => Id | null;

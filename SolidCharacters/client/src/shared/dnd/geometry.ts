import type { Coord, Rect } from "./types";

/** Read a node's bounding rect into our plain {@link Rect} shape. */
export function measure(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, width: r.width, height: r.height };
}

/** Center point of a rect. */
export function center(r: Rect): Coord {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

/** Euclidean distance between two points. */
export function distance(a: Coord, b: Coord): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Translate a rect by a delta. */
export function translateRect(r: Rect, delta: Coord): Rect {
  return { x: r.x + delta.x, y: r.y + delta.y, width: r.width, height: r.height };
}

/** Whether a point lies within a rect, excluding the right/bottom edges. */
export function containsPoint(r: Rect, p: Coord): boolean {
  return p.x >= r.x && p.x < r.x + r.width && p.y >= r.y && p.y < r.y + r.height;
}

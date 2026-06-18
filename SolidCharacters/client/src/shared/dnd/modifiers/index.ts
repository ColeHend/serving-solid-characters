import type { Modifier } from "../state";

/** Lock movement to the vertical axis. */
export const restrictToVerticalAxis: Modifier = ({ transform }) => ({ x: 0, y: transform.y });

/** Lock movement to the horizontal axis. */
export const restrictToHorizontalAxis: Modifier = ({ transform }) => ({ x: transform.x, y: 0 });

/** Snap the transform to a grid of the given size (px). */
export function snapToGrid(size: number): Modifier {
  return ({ transform }) => ({
    x: Math.round(transform.x / size) * size,
    y: Math.round(transform.y / size) * size,
  });
}

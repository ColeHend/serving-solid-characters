import type { DragState } from "../state";
import type { Id } from "../types";

/**
 * A sensor binds input listeners to a draggable's activator element and drives
 * the drag {@link DragState} machine. Each sensor owns its own activation
 * constraints and (for pointer) pointer-capture lifecycle.
 *
 * Returns a cleanup function that removes all listeners.
 */
export type Sensor = (args: {
  node: HTMLElement;
  id: Id;
  state: DragState;
  getDisabled?: () => boolean;
}) => () => void;

/** Activation constraints to distinguish an intentional drag from a click/scroll. */
export interface ActivationConstraint {
  /** Minimum pointer travel (px) before a drag starts. */
  distance?: number;
  /** Hold duration (ms) before a drag starts. */
  delay?: number;
  /** Movement (px) tolerated during `delay` before the press is cancelled. */
  tolerance?: number;
}

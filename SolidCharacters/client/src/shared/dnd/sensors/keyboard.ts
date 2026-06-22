import type { Direction } from "../collision/directional";
import type { Sensor } from "./types";

const ARROWS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

export interface KeyboardSensorOptions {
  /** Reverse left/right for right-to-left layouts. */
  rtl?: boolean;
  /** Add or override key bindings for movement, pickup/drop, and cancel. */
  keyMap?: Partial<Record<string, Direction | "toggle" | "cancel">>;
}

/**
 * Keyboard sensor — accessible, discrete drag.
 *
 * Space/Enter picks up and drops; arrow keys move by one step (discrete); Escape
 * cancels. Movement is intentionally NOT continuous: the {@link DragState}
 * resolves the next target with a directional collision model, distinct from
 * pointer collision.
 */
export function keyboardSensor(options: KeyboardSensorOptions = {}): Sensor {
  return ({ node, id, state, getDisabled }) => {
    const isDisabled = () => getDisabled?.() ?? false;

    const resolve = (dir: Direction): Direction => {
      if (!options.rtl) return dir;
      if (dir === "left") return "right";
      if (dir === "right") return "left";
      return dir;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const active = state.activeId() === id;
      if (isDisabled() && !active) return;

      const command =
        options.keyMap?.[e.key] ??
        (e.key === " " || e.key === "Enter"
          ? "toggle"
          : e.key === "Escape"
            ? "cancel"
            : ARROWS[e.key]);

      if (command === "toggle") {
        e.preventDefault();
        e.stopPropagation();
        if (active) state.end();
        else if (state.activeId() == null) state.start(id, null);
        return;
      }
      if (!active) return;
      if (command === "cancel") {
        e.preventDefault();
        e.stopPropagation();
        state.cancel();
        return;
      }
      if (command) {
        e.preventDefault();
        e.stopPropagation();
        state.keyboardMove(resolve(command));
      }
    };

    node.addEventListener("keydown", onKeyDown);
    const addedTabIndex = !isDisabled() && !node.hasAttribute("tabindex");
    if (addedTabIndex) node.setAttribute("tabindex", "0");
    return () => {
      node.removeEventListener("keydown", onKeyDown);
      if (addedTabIndex) node.removeAttribute("tabindex");
    };
  };
}

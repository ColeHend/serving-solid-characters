import type { Coord } from "../types";
import type { ActivationConstraint, Sensor } from "./types";

const DEFAULT: ActivationConstraint = { distance: 4 };

/**
 * Pointer (mouse/pen/touch via Pointer Events) sensor.
 *
 * Owns the pointer-capture lifecycle: captures on activation, releases on
 * end/cancel. Movement listeners are attached with `{ passive: false }` so the
 * drag can call `preventDefault()` to block scrolling/selection. Secondary
 * pointers and non-primary buttons are ignored.
 */
export function pointerSensor(constraint: ActivationConstraint = DEFAULT): Sensor {
  return ({ node, id, state, getDisabled }) => {
    let pointerId: number | null = null;
    let start: Coord | null = null;
    let activated = false;
    let delayTimer: ReturnType<typeof setTimeout> | null = null;
    let initialTouchAction: string | null = null;
    let initialUserSelect: string | null = null;

    const point = (e: PointerEvent): Coord => ({ x: e.clientX, y: e.clientY });
    const isDisabled = () => getDisabled?.() ?? false;

    const preventNativeGestures = () => {
      if (initialTouchAction == null) initialTouchAction = node.style.touchAction;
      node.style.touchAction = "none";
    };

    const preventSelection = () => {
      if (initialUserSelect == null) initialUserSelect = node.style.userSelect;
      node.style.userSelect = "none";
    };

    const clearDelay = () => {
      if (delayTimer != null) {
        clearTimeout(delayTimer);
        delayTimer = null;
      }
    };

    const activate = () => {
      if (activated || pointerId == null || !start) return;
      if (isDisabled()) {
        teardown();
        return;
      }
      activated = true;
      clearDelay();
      try {
        node.setPointerCapture(pointerId);
      } catch {
        /* capture is best-effort */
      }
      preventSelection();
      state.start(id, start);
      if (state.activeId() !== id) teardown();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pointerId == null || e.pointerId !== pointerId || !start) return;
      const p = point(e);
      if (!activated) {
        const dx = p.x - start.x;
        const dy = p.y - start.y;
        const dist = Math.hypot(dx, dy);
        if (constraint.delay != null) {
          // delay mode: too much travel before the timer fires cancels the press
          if (constraint.tolerance != null && dist > constraint.tolerance) teardown();
          return;
        }
        if (dist >= (constraint.distance ?? 0)) activate();
        if (!activated) return;
      }
      e.preventDefault();
      state.pointerMove(p);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pointerId != null && e.pointerId !== pointerId) return;
      if (activated) state.end();
      teardown();
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (pointerId != null && e.pointerId !== pointerId) return;
      if (activated) state.cancel();
      teardown();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (activated && e.key === "Escape") {
        state.cancel();
        teardown();
      }
    };

    function teardown() {
      clearDelay();
      if (pointerId != null) {
        try {
          node.releasePointerCapture(pointerId);
        } catch {
          /* ignore */
        }
      }
      if (initialTouchAction != null) {
        node.style.touchAction = initialTouchAction;
        initialTouchAction = null;
      }
      if (initialUserSelect != null) {
        node.style.userSelect = initialUserSelect;
        initialUserSelect = null;
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("keydown", onKeyDown);
      pointerId = null;
      start = null;
      activated = false;
    }

    const onPointerDown = (e: PointerEvent) => {
      if (pointerId != null) return; // ignore secondary pointers
      if (isDisabled()) return;
      if (e.button !== 0) return; // primary button only
      pointerId = e.pointerId;
      start = point(e);
      preventNativeGestures();
      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerCancel);
      window.addEventListener("keydown", onKeyDown);
      if (constraint.delay != null) {
        delayTimer = setTimeout(activate, constraint.delay);
      } else if ((constraint.distance ?? 0) === 0) {
        activate();
      }
    };

    node.addEventListener("pointerdown", onPointerDown);
    return () => {
      node.removeEventListener("pointerdown", onPointerDown);
      if (activated && state.activeId() === id) state.cancel();
      teardown();
    };
  };
}

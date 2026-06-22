/**
 * Tap-vs-drag pointer handling shared by the Add-palette cards (`FieldCard` /
 * `StaticFieldCard`). On press it notifies `onGrab` (so the shell's drag overlay
 * can start tracking) and records the down point; on release it fires `onTap` only
 * when the pointer barely moved — a tap, not a drag.
 */

// Pointer travel (px) below which a press counts as a tap, not a drag. Matches the
// pointer sensor's 4px activation distance so a tap never also starts a drag.
const TAP_THRESHOLD = 4;

export interface TapHandlers {
  onPointerDown: (e: PointerEvent) => void;
  onPointerUp: (e: PointerEvent) => void;
}

export function paletteCardTap(onGrab: (x: number, y: number) => void, onTap: () => void): TapHandlers {
  // Mutable object so the prefer-const autofix can't break the reassignments.
  const down = { x: 0, y: 0, id: -1 };
  return {
    onPointerDown(e: PointerEvent) {
      onGrab(e.clientX, e.clientY);
      down.x = e.clientX;
      down.y = e.clientY;
      down.id = e.pointerId;
    },
    onPointerUp(e: PointerEvent) {
      if (e.pointerId !== down.id) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down.id = -1;
      if (moved < TAP_THRESHOLD) onTap();
    },
  };
}

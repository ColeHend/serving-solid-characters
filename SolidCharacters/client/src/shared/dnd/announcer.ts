import { createSignal, onMount, type Accessor } from "solid-js";
import { isServer } from "solid-js/web";
import type { InternalEvent } from "./state";

/** Screen-reader announcement copy. Every entry is overridable. */
export interface Announcements {
  onDragStart?: (e: InternalEvent) => string;
  onDragOver?: (e: InternalEvent) => string;
  onDragEnd?: (e: InternalEvent) => string;
  onDragCancel?: (e: InternalEvent) => string;
}

export const defaultAnnouncements: Required<Announcements> = {
  onDragStart: (e) => `Picked up item ${e.active.id}.`,
  onDragOver: (e) =>
    e.over ? `Item ${e.active.id} is over ${e.over.id}.` : `Item ${e.active.id} is no longer over a target.`,
  onDragEnd: (e) =>
    e.over ? `Dropped item ${e.active.id} on ${e.over.id}.` : `Dropped item ${e.active.id}.`,
  onDragCancel: (e) => `Cancelled dragging item ${e.active.id}.`,
};

const THROTTLE_MS = 200;

export interface Announcer {
  message: Accessor<string>;
  announce: (text: string, opts?: { throttle?: boolean }) => void;
}

/**
 * ARIA live-region announcer. Drop/pickup/cancel are assertive (immediate);
 * per-move `over` updates are throttled (~200ms) so held-key movement does not
 * spam assistive technology.
 */
export function createAnnouncer(): Announcer {
  const [message, setMessage] = createSignal("");
  let lastAt = 0;

  const announce: Announcer["announce"] = (text, opts) => {
    if (isServer) return;
    if (opts?.throttle && text === message()) return;
    const now = Date.now();
    if (opts?.throttle && now - lastAt < THROTTLE_MS) return;
    lastAt = now;
    setMessage(text);
  };

  return { message, announce };
}

/** Props for the visually-hidden live region element. */
export function liveRegionStyle(): Record<string, string> {
  return {
    position: "fixed",
    width: "1px",
    height: "1px",
    margin: "-1px",
    border: "0",
    padding: "0",
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    "clip-path": "inset(100%)",
    "white-space": "nowrap",
  };
}

/** Hook to wire announcements; no-op on the server. */
export function useAnnouncerMount(cb: () => void) {
  if (!isServer) onMount(cb);
}

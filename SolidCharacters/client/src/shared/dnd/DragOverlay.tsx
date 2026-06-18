import { createMemo, Show, type JSX } from "solid-js";
import { isServer, Portal } from "solid-js/web";
import { useDragDropContext } from "./context";
import type { ActiveItem, DataMap, DefaultDataMap } from "./types";

export interface DragOverlayProps<M extends DataMap = DefaultDataMap> {
  /**
   * Render the preview for the active item. `active` is `null` when idle, so
   * the null case is part of the type — no cast required.
   */
  children: (active: ActiveItem<M> | null) => JSX.Element;
  class?: string;
  style?: JSX.CSSProperties;
}

/**
 * Portal-rendered drag preview, decoupled from the source node and positioned
 * via `transform` only. SSR-safe: never renders on the server.
 */
export function DragOverlay<M extends DataMap = DefaultDataMap>(props: DragOverlayProps<M>) {
  const { state } = useDragDropContext();

  const activeItem = createMemo<ActiveItem<M> | null>(() => {
    const entry = state.getActiveEntry();
    if (!entry) return null;
    return { id: entry.id, type: entry.getType(), data: entry.getData() } as unknown as ActiveItem<M>;
  });

  const position = createMemo<JSX.CSSProperties>(() => {
    const rect = state.activeRect();
    const t = state.transform();
    const x = (rect?.x ?? 0) + t.x;
    const y = (rect?.y ?? 0) + t.y;
    return {
      position: "fixed",
      top: "0",
      left: "0",
      "pointer-events": "none",
      transform: `translate(${x}px, ${y}px)`,
      ...(props.style ?? {}),
    };
  });

  return (
    <Show when={!isServer && state.activeId() != null}>
      <Portal>
        <div class={props.class} style={position()}>
          {props.children(activeItem())}
        </div>
      </Portal>
    </Show>
  );
}

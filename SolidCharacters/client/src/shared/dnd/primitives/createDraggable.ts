import { createEffect, createMemo, onCleanup, untrack, type Accessor } from "solid-js";
import { useDragDropContext } from "../context";
import type { Coord, Draggable, DraggableInput } from "../types";

/**
 * Headless draggable primitive.
 *
 * Attach `ref` to the draggable node (primary mechanism). Optionally attach
 * `handleRef` to a child to restrict the drag activator to that handle.
 * Returned values are accessors — call them: `drag.isActive()`.
 *
 * @example
 * const drag = createDraggable(() => ({ id: props.id, data: props.data }));
 * <div ref={drag.ref} classList={{ dragging: drag.isActive() }}>…</div>
 */
export function createDraggable(input: () => DraggableInput): Draggable {
  const { state, sensors } = useDragDropContext();

  let node: HTMLElement | null = null;
  let handle: HTMLElement | null = null;

  const id = createMemo(() => input().id);
  const disabled = createMemo(() => input().disabled ?? false);

  // Register (re-register if the id changes).
  createEffect(() => {
    const currentId = id();
    const dispose = state.registerDraggable({
      id: currentId,
      getNode: () => node,
      getType: () => input().type,
      getData: () => input().data,
      getDisabled: disabled,
    });
    onCleanup(dispose);
  });

  const applyActivatorAttributes = (activator: HTMLElement) => {
    if (!activator.hasAttribute("role")) activator.setAttribute("role", "button");
    activator.setAttribute("aria-roledescription", "draggable");
    if (disabled()) activator.setAttribute("aria-disabled", "true");
    else activator.removeAttribute("aria-disabled");
  };

  // Bind sensors to the activator element (handle if present, else node).
  const bindSensors = () => {
    const activator = handle ?? node;
    if (!activator) return;
    applyActivatorAttributes(activator);
    if (disabled()) return;
    const cleanups = sensors.map((s) => s({ node: activator, id: id(), state, getDisabled: disabled }));
    return () => cleanups.forEach((c) => c());
  };

  let unbind: (() => void) | undefined;
  const rebind = () => {
    unbind?.();
    unbind = bindSensors() ?? undefined;
  };
  onCleanup(() => unbind?.());

  createEffect(() => {
    const currentId = id();
    if (disabled() && untrack(state.activeId) === currentId) state.cancel();
    rebind();
  });

  const isActive = createMemo(() => state.activeId() === id());
  const transform: Accessor<Coord | null> = () => (isActive() ? state.transform() : null);

  return {
    ref(el) {
      node = el;
      if (!handle) rebind();
    },
    handleRef(el) {
      handle = el;
      rebind();
    },
    isActive,
    transform,
  };
}

import { createEffect, createMemo, onCleanup } from "solid-js";
import { useDragDropContext } from "../context";
import type { DataMap, DefaultDataMap, Droppable, DroppableInput, Item } from "../types";

/**
 * Headless droppable primitive.
 *
 * `accepts` is a type-guard predicate (not a string list), enabling real
 * narrowing of the accepted item's `data` in event handlers.
 *
 * @example
 * const drop = createDroppable(() => ({ id: props.id, accepts: (i) => i.type === "card" }));
 * <div ref={drop.ref} classList={{ over: drop.isOver() }}>…</div>
 */
export function createDroppable<M extends DataMap = DefaultDataMap>(
  input: () => DroppableInput<M>,
): Droppable {
  const { state } = useDragDropContext();

  let node: HTMLElement | null = null;
  const id = createMemo(() => input().id);
  const isDisabled = createMemo(() => input().disabled ?? false);

  createEffect(() => {
    const currentId = id();
    const dispose = state.registerDroppable({
      id: currentId,
      getNode: () => node,
      getType: () => input().type,
      getData: () => input().data,
      getDisabled: isDisabled,
      accepts: (item) => {
        const predicate = input().accepts;
        return predicate ? predicate(item as Item<M>) : true;
      },
    });
    onCleanup(dispose);
  });

  const isOver = createMemo(() => state.overId() === id());

  const applyAttributes = () => {
    if (!node) return;
    if (!node.hasAttribute("role")) node.setAttribute("role", "region");
    if (!node.hasAttribute("aria-label") && !node.hasAttribute("aria-labelledby")) {
      node.setAttribute("aria-label", `Droppable zone ${String(id())}`);
    }
    if (isDisabled()) node.setAttribute("aria-disabled", "true");
    else node.removeAttribute("aria-disabled");
  };

  createEffect(() => {
    id();
    isDisabled();
    applyAttributes();
  });

  return {
    ref(el) {
      node = el;
      applyAttributes();
    },
    isOver,
    isDisabled,
    active: state.activeId,
  };
}

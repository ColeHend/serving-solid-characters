import { splitProps, type JSX } from "solid-js";
import { createDroppable } from "../primitives/createDroppable";
import type { AcceptsPredicate, DataMap, DefaultDataMap, Id } from "../types";

export interface DroppableProps<M extends DataMap = DefaultDataMap>
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "id"> {
  id: Id;
  type?: string;
  data?: unknown;
  disabled?: boolean;
  accepts?: AcceptsPredicate<M>;
}

/** Thin component wrapper over {@link createDroppable} for the simple case. */
export function Droppable<M extends DataMap = DefaultDataMap>(props: DroppableProps<M>) {
  const [local, rest] = splitProps(props, ["id", "type", "data", "disabled", "accepts", "children"]);
  const drop = createDroppable<M>(() => ({
    id: local.id,
    type: local.type,
    data: local.data,
    disabled: local.disabled,
    accepts: local.accepts,
  }));

  return (
    <div
      ref={drop.ref}
      data-over={drop.isOver() ? "" : undefined}
      data-disabled={drop.isDisabled() ? "" : undefined}
      {...rest}
    >
      {local.children}
    </div>
  );
}

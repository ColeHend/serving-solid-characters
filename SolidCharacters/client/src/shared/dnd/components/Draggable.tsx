import { splitProps, type JSX } from "solid-js";
import { createDraggable } from "../primitives/createDraggable";
import type { Id } from "../types";

export interface DraggableProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "id"> {
  id: Id;
  type?: string;
  data?: unknown;
  disabled?: boolean;
}

/** Thin component wrapper over {@link createDraggable} for the simple case. */
export function Draggable(props: DraggableProps) {
  const [local, rest] = splitProps(props, ["id", "type", "data", "disabled", "children"]);
  const drag = createDraggable(() => ({
    id: local.id,
    type: local.type,
    data: local.data,
    disabled: local.disabled,
  }));

  return (
    <div
      ref={drag.ref}
      data-dragging={drag.isActive() ? "" : undefined}
      style={{ "touch-action": "none", cursor: "grab" }}
      {...rest}
    >
      {local.children}
    </div>
  );
}

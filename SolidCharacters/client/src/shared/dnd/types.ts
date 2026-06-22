import type { Accessor } from "solid-js";

/** Unique identifier for a draggable or droppable node. */
export type Id = string | number;

/** A 2D coordinate / offset in client (viewport) space. */
export interface Coord {
  x: number;
  y: number;
}

/** A measured bounding rectangle in client (viewport) space. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The user-supplied "type map" that powers end-to-end typing.
 *
 * Each key is a drag `type`, each value is the shape of that type's `data`.
 * Supplied once to {@link DragDropProvider} so events narrow correctly:
 *
 * @example
 * type MyDnD = { card: CardData; column: ColumnData };
 */
export type DataMap = Record<string, unknown>;

/** A default permissive map for users who don't want typed payloads. */
export interface DefaultDataMap {
  [type: string]: unknown;
}

/**
 * A discriminated union of every item kind in the provider's {@link DataMap}.
 * `type` is the discriminant, so `if (item.type === "card")` narrows `data`.
 */
export type Item<M extends DataMap> = {
  [K in keyof M]: { id: Id; type: K & string; data: M[K] };
}[keyof M];

/** The active (currently dragged) item. */
export type ActiveItem<M extends DataMap> = Item<M>;

/** A droppable target the active item is over. */
export type OverItem<M extends DataMap> = Item<M>;

/** Lifecycle event payload shared by all drag events. */
export interface DragEventPayload<M extends DataMap> {
  active: ActiveItem<M>;
  over: OverItem<M> | null;
  /** Accumulated movement since drag start, in client space. */
  delta: Coord;
}

export type DragStartEvent<M extends DataMap> = Omit<DragEventPayload<M>, "over" | "delta">;
export type DragMoveEvent<M extends DataMap> = DragEventPayload<M>;
export type DragOverEvent<M extends DataMap> = DragEventPayload<M>;
export type DragEndEvent<M extends DataMap> = DragEventPayload<M>;
export type DragCancelEvent<M extends DataMap> = DragEventPayload<M>;

/** A predicate that decides whether a droppable accepts an item. */
export type AcceptsPredicate<M extends DataMap> = (item: Item<M>) => boolean;

/** Reactive inputs for {@link createDraggable}. */
export interface DraggableInput {
  id: Id;
  type?: string;
  data?: unknown;
  disabled?: boolean;
}

/** Reactive inputs for {@link createDroppable}. */
export interface DroppableInput<M extends DataMap = DefaultDataMap> {
  id: Id;
  type?: string;
  data?: unknown;
  disabled?: boolean;
  accepts?: AcceptsPredicate<M>;
}

/** Public shape returned by {@link createDraggable}. */
export interface Draggable {
  /** Ref callback for the draggable node (primary attachment mechanism). */
  ref: (el: HTMLElement) => void;
  /** Ref callback for an optional drag handle inside the node. */
  handleRef: (el: HTMLElement) => void;
  /** Whether this draggable is the one currently being dragged. */
  isActive: Accessor<boolean>;
  /** Current transform to apply while dragging (client-space delta). */
  transform: Accessor<Coord | null>;
}

/** Public shape returned by {@link createDroppable}. */
export interface Droppable {
  /** Ref callback for the droppable node. */
  ref: (el: HTMLElement) => void;
  /** Whether the active item is currently over this droppable. */
  isOver: Accessor<boolean>;
  /** Whether this droppable is currently disabled. */
  isDisabled: Accessor<boolean>;
  /** The active item id (regardless of whether it is over this droppable). */
  active: Accessor<Id | null>;
}

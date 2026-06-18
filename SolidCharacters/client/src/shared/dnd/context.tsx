import {
  createContext,
  useContext,
  type JSX,
} from "solid-js";
import {
  createAnnouncer,
  defaultAnnouncements,
  liveRegionStyle,
  type Announcements,
} from "./announcer";
import { createDragState, type DragState, type InternalEvent, type Modifier } from "./state";
import type { CollisionDetector } from "./collision/types";
import type { Sensor } from "./sensors/types";
import { pointerSensor } from "./sensors/pointer";
import { keyboardSensor } from "./sensors/keyboard";
import type {
  DataMap,
  DefaultDataMap,
  DragCancelEvent,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragStartEvent,
  Id,
} from "./types";

/** Internal context shared with primitives. */
export interface DndContextValue {
  state: DragState;
  sensors: Sensor[];
}

const DndContext = createContext<DndContextValue>();

export interface DragDropProviderProps<M extends DataMap = DefaultDataMap> {
  /** Input sensors. Defaults to pointer + keyboard. */
  sensors?: Sensor[];
  /** Collision strategy. Defaults to `closestCenter`. */
  collisionDetection?: CollisionDetector;
  /** Transform constraints applied each update. */
  modifiers?: Modifier[];
  onDragStart?: (e: DragStartEvent<M>) => void;
  onDragMove?: (e: DragMoveEvent<M>) => void;
  onDragOver?: (e: DragOverEvent<M>) => void;
  onDragEnd?: (e: DragEndEvent<M>) => void;
  onDragCancel?: (e: DragCancelEvent<M>) => void;
  /** Screen-reader announcement overrides. */
  announcements?: Announcements;
  children: JSX.Element;
}

export function DragDropProvider<M extends DataMap = DefaultDataMap>(
  props: DragDropProviderProps<M>,
) {
  const assertive = createAnnouncer();
  const polite = createAnnouncer();
  const copy = { ...defaultAnnouncements, ...props.announcements };

  // Internal events use `unknown` data; cast to the user's typed map at the edge.
  const cast = <T,>(e: InternalEvent) => e as unknown as T;

  const state = createDragState({
    collisionDetector: props.collisionDetection,
    modifiers: props.modifiers,
    onDragStart: (e) => {
      assertive.announce(copy.onDragStart(e));
      props.onDragStart?.(cast<DragStartEvent<M>>(e));
    },
    onDragMove: (e) => props.onDragMove?.(cast<DragMoveEvent<M>>(e)),
    onDragOver: (e) => {
      polite.announce(copy.onDragOver(e), { throttle: true });
      props.onDragOver?.(cast<DragOverEvent<M>>(e));
    },
    onDragEnd: (e) => {
      assertive.announce(copy.onDragEnd(e));
      props.onDragEnd?.(cast<DragEndEvent<M>>(e));
    },
    onDragCancel: (e) => {
      assertive.announce(copy.onDragCancel(e));
      props.onDragCancel?.(cast<DragCancelEvent<M>>(e));
    },
  });

  const sensors = props.sensors ?? [pointerSensor(), keyboardSensor()];
  const value: DndContextValue = { state, sensors };

  return (
    <DndContext.Provider value={value}>
      {props.children}
      <div aria-live="assertive" aria-atomic="true" style={liveRegionStyle()}>
        {assertive.message()}
      </div>
      <div aria-live="polite" aria-atomic="true" style={liveRegionStyle()}>
        {polite.message()}
      </div>
    </DndContext.Provider>
  );
}

/** Access the drag-and-drop context. Throws outside a provider. */
export function useDragDropContext(): DndContextValue {
  const ctx = useContext(DndContext);
  if (!ctx) throw new Error("useDragDropContext must be used within a <DragDropProvider>");
  return ctx;
}

/**
 * Public imperative + reactive handle on the active drag.
 * `cancel()` aborts; `startDrag(id)` begins a keyboard-style drag programmatically.
 */
export function useDragDrop() {
  const { state } = useDragDropContext();
  return {
    activeId: state.activeId,
    overId: state.overId,
    cancel: () => state.cancel(),
    startDrag: (id: Id) => state.start(id, null),
  };
}

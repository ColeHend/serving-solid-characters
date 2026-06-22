// EXCEPTION to the repo's ≤200-line rule: `createDragState` closes over many
// per-drag mutable locals (active/over entries, transform, sensor cleanups,
// collision context). Splitting it across files would scatter that shared
// closure and hurt readability more than the length costs. Vendored as-is from
// SolidDragNDrop — see ./README.md.
import { batch, createMemo, createSignal, type Accessor } from "solid-js";
import { center, measure, translateRect } from "./geometry";
import type { CollisionDetector } from "./collision/types";
import { closestCenter } from "./collision/closestCenter";
import { directionalNext, type Direction } from "./collision/directional";
import type { Coord, Id, Rect } from "./types";

/** Internal registration record for a draggable node. */
export interface DraggableEntry {
  id: Id;
  getNode: () => HTMLElement | null;
  getType: () => string | undefined;
  getData: () => unknown;
  getDisabled: () => boolean;
}

/** Internal registration record for a droppable node. */
export interface DroppableEntry {
  id: Id;
  getNode: () => HTMLElement | null;
  getType: () => string | undefined;
  getData: () => unknown;
  getDisabled: () => boolean;
  accepts: (item: InternalItem) => boolean;
}

/** A constraint applied to the drag transform every update. */
export type Modifier = (args: { transform: Coord; activeRect: Rect }) => Coord;

/** Minimal item shape used internally and surfaced (cast) to typed events. */
export interface InternalItem {
  id: Id;
  type: string | undefined;
  data: unknown;
}

export interface InternalEvent {
  active: InternalItem;
  over: InternalItem | null;
  delta: Coord;
}

export interface StateConfig {
  collisionDetector?: CollisionDetector;
  modifiers?: Modifier[];
  onDragStart?: (e: InternalEvent) => void;
  onDragMove?: (e: InternalEvent) => void;
  onDragOver?: (e: InternalEvent) => void;
  onDragEnd?: (e: InternalEvent) => void;
  onDragCancel?: (e: InternalEvent) => void;
}

export interface DragState {
  activeId: Accessor<Id | null>;
  overId: Accessor<Id | null>;
  /** Raw accumulated pointer movement since drag start. */
  delta: Accessor<Coord>;
  /** Modifier-constrained transform to render (overlay / in-place). */
  transform: Accessor<Coord>;
  /** Bounding rect of the active node measured at drag start. */
  activeRect: Accessor<Rect | null>;
  registerDraggable: (entry: DraggableEntry) => () => void;
  registerDroppable: (entry: DroppableEntry) => () => void;
  getActiveEntry: () => DraggableEntry | null;
  /** Begin a drag. `pointer` is null for keyboard. */
  start: (id: Id, pointer: Coord | null) => void;
  /** Pointer/touch continuous update with an absolute pointer position. */
  pointerMove: (pointer: Coord) => void;
  /** Keyboard discrete update in an arrow direction. */
  keyboardMove: (direction: Direction) => void;
  /** Commit the drag (drop). */
  end: () => void;
  /** Abort the drag. */
  cancel: () => void;
}

export function createDragState(config: StateConfig = {}): DragState {
  const collisionDetector = config.collisionDetector ?? closestCenter;
  const modifiers = config.modifiers ?? [];

  const [activeId, setActiveId] = createSignal<Id | null>(null);
  const [overId, setOverId] = createSignal<Id | null>(null);
  const [delta, setDelta] = createSignal<Coord>({ x: 0, y: 0 });
  const [activeRectSignal, setActiveRectSignal] = createSignal<Rect | null>(null);

  const draggables = new Map<Id, DraggableEntry>();
  const droppables = new Map<Id, DroppableEntry>();

  // Per-drag cached geometry (the §2.3 "measure once" discipline).
  let origin: Coord | null = null; // fixed pointer position at drag start
  let pointer: Coord | null = null; // current pointer (collision input)
  let activeRect: Rect | null = null;
  let activeStartCenter: Coord | null = null;
  let candidateRects = new Map<Id, Rect>();
  let remeasureFrame: number | null = null;

  const applyModifiers = (raw: Coord): Coord => {
    if (!activeRect) return raw;
    let t = raw;
    for (const m of modifiers) t = m({ transform: t, activeRect });
    return t;
  };

  const transform = createMemo((): Coord => applyModifiers(delta()));

  const itemFromDraggable = (entry: DraggableEntry): InternalItem => ({
    id: entry.id,
    type: entry.getType(),
    data: entry.getData(),
  });

  const itemFromDroppable = (id: Id | null): InternalItem | null => {
    if (id == null) return null;
    const d = droppables.get(id);
    return d ? { id: d.id, type: d.getType(), data: d.getData() } : null;
  };

  const getActiveEntry = (): DraggableEntry | null => {
    const id = activeId();
    return id == null ? null : draggables.get(id) ?? null;
  };

  const snapshotCandidates = (active: DraggableEntry) => {
    candidateRects = new Map();
    const item = itemFromDraggable(active);
    for (const d of droppables.values()) {
      if (d.getDisabled() || !d.accepts(item)) continue;
      const node = d.getNode();
      if (node) candidateRects.set(d.id, measure(node));
    }
  };

  const candidateList = () => [...candidateRects].map(([id, rect]) => ({ id, rect }));

  const currentEvent = (): InternalEvent | null => {
    const active = getActiveEntry();
    if (!active) return null;
    return { active: itemFromDraggable(active), over: itemFromDroppable(overId()), delta: delta() };
  };

  const recomputeOver = () => {
    if (!activeRect) return;
    const movedRect = translateRect(activeRect, transform());
    const detected = collisionDetector({ activeRect: movedRect, pointer, candidates: candidateList() });
    const next = detected != null && candidateRects.has(detected) ? detected : null;
    if (next !== overId()) {
      setOverId(next);
      const e = currentEvent();
      if (e) config.onDragOver?.(e);
    }
  };

  const remeasureCandidates = () => {
    const active = getActiveEntry();
    if (!active) return;
    const item = itemFromDraggable(active);
    for (const id of [...candidateRects.keys()]) {
      const droppable = droppables.get(id);
      const node = droppable?.getNode();
      if (!droppable || droppable.getDisabled() || !droppable.accepts(item) || !node) {
        candidateRects.delete(id);
      } else {
        candidateRects.set(id, measure(node));
      }
    }
    recomputeOver();
  };

  const scheduleRemeasure = () => {
    if (typeof window === "undefined" || remeasureFrame != null) return;
    const requestFrame = window.requestAnimationFrame ?? ((cb: FrameRequestCallback) => window.setTimeout(() => cb(Date.now()), 0));
    remeasureFrame = requestFrame(() => {
      remeasureFrame = null;
      remeasureCandidates();
    });
  };

  const teardownListeners = () => {
    if (typeof window === "undefined") return;
    if (remeasureFrame != null) {
      if (window.cancelAnimationFrame) window.cancelAnimationFrame(remeasureFrame);
      else window.clearTimeout(remeasureFrame);
      remeasureFrame = null;
    }
    window.removeEventListener("scroll", scheduleRemeasure);
    window.removeEventListener("resize", scheduleRemeasure);
  };

  const reset = () => {
    teardownListeners();
    origin = null;
    pointer = null;
    activeRect = null;
    activeStartCenter = null;
    candidateRects = new Map();
    batch(() => {
      setActiveId(null);
      setOverId(null);
      setDelta({ x: 0, y: 0 });
      setActiveRectSignal(null);
    });
  };

  return {
    activeId,
    overId,
    delta,
    transform,
    activeRect: activeRectSignal,
    registerDraggable(entry) {
      draggables.set(entry.id, entry);
      return () => draggables.delete(entry.id);
    },
    registerDroppable(entry) {
      droppables.set(entry.id, entry);
      return () => droppables.delete(entry.id);
    },
    getActiveEntry,
    start(id, startPointer) {
      if (activeId() != null) return;
      const entry = draggables.get(id);
      if (!entry || entry.getDisabled()) return;
      const node = entry.getNode();
      if (!node) return;
      activeRect = measure(node);
      activeStartCenter = activeRect ? center(activeRect) : null;
      setActiveRectSignal(activeRect);
      origin = startPointer;
      pointer = startPointer;
      batch(() => {
        setActiveId(id);
        setDelta({ x: 0, y: 0 });
        setOverId(null);
      });
      snapshotCandidates(entry);
      const e = currentEvent();
      if (e) config.onDragStart?.(e);
      recomputeOver();
      if (typeof window !== "undefined") {
        window.addEventListener("scroll", scheduleRemeasure, { passive: true });
        window.addEventListener("resize", scheduleRemeasure);
      }
    },
    pointerMove(next) {
      if (activeId() == null || !origin) return;
      pointer = next;
      setDelta({ x: next.x - origin.x, y: next.y - origin.y });
      recomputeOver();
      const e = currentEvent();
      if (e) config.onDragMove?.(e);
    },
    keyboardMove(direction) {
      if (activeId() == null || !activeStartCenter) return;
      const ref =
        overId() != null && candidateRects.has(overId()!)
          ? center(candidateRects.get(overId()!)!)
          : { x: activeStartCenter.x + delta().x, y: activeStartCenter.y + delta().y };
      const next = directionalNext(ref, direction, candidateList());
      if (next == null) return;
      const targetCenter = center(candidateRects.get(next)!);
      batch(() => {
        setDelta({
          x: targetCenter.x - activeStartCenter!.x,
          y: targetCenter.y - activeStartCenter!.y,
        });
        setOverId(next);
      });
      const e = currentEvent();
      if (e) {
        config.onDragMove?.(e);
        config.onDragOver?.(e);
      }
    },
    end() {
      const e = currentEvent();
      if (e) config.onDragEnd?.(e);
      reset();
    },
    cancel() {
      const e = currentEvent();
      if (e) config.onDragCancel?.(e);
      reset();
    },
  };
}

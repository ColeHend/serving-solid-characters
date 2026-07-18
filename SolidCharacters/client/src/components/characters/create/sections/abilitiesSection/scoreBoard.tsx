import { Component, For } from "solid-js";
import { createDraggable, createDroppable } from "../../../../../shared/dnd";
import { AbilityKey } from "../../rules/constants";
import styles from "./abilitiesSection.module.scss";

// Drag payloads: a pool number, or an already-assigned box value. Drop targets:
// a stat box, or the pool (drag back to clear).
export type ScoreDrag =
  | { kind: "pool"; value: number }
  | { kind: "box"; statKey: AbilityKey; value: number };
export type ScoreDrop = { kind: "pool" } | { kind: "box"; statKey: AbilityKey };

export type ScoreDropResult =
  | { type: "assign"; key: AbilityKey; value: number }
  | { type: "swap"; a: AbilityKey; b: AbilityKey }
  | { type: "clear"; key: AbilityKey }
  | null;

/** Map a drag payload + drop target to the store mutation it implies. */
export function resolveScoreDrop(active: ScoreDrag, over: ScoreDrop | undefined): ScoreDropResult {
  if (!over) return null; // dropped on empty space (pointerWithin) → no-op
  if (over.kind === "box") {
    if (active.kind === "pool") return { type: "assign", key: over.statKey, value: active.value };
    if (active.statKey !== over.statKey) return { type: "swap", a: active.statKey, b: over.statKey };
    return null;
  }
  if (active.kind === "box") return { type: "clear", key: active.statKey };
  return null;
}

/** Values of `pool` still unassigned (multiset difference against the base scores). */
export function remainingPool(pool: number[], assigned: number[]): number[] {
  const remaining = [...pool];
  assigned.forEach((value) => {
    const index = remaining.indexOf(value);
    if (index >= 0) remaining.splice(index, 1);
  });
  return remaining;
}

// A draggable pool number. Rendered inside the provider, so createDraggable resolves
// the drag context. Ids are index-based — rolled pools may hold duplicate values.
const PoolChip: Component<{ value: number; index: number; disabled: boolean }> = (props) => {
  const drag = createDraggable(() => ({
    id: `pool:${props.index}`,
    type: "score",
    data: { kind: "pool", value: props.value },
    disabled: props.disabled,
  }));
  return (
    <span
      ref={drag.ref}
      class={styles.poolChip}
      classList={{ [styles.poolChipDragging]: drag.isActive() }}
    >
      {props.value}
    </span>
  );
};

/** The unassigned-score pool; also a drop target so an assigned value can be dragged back to clear it. */
export const PoolZone: Component<{ pool: number[]; disabled: boolean }> = (props) => {
  const drop = createDroppable(() => ({
    id: "pool",
    type: "pool",
    data: { kind: "pool" },
    disabled: props.disabled,
  }));
  return (
    <div ref={drop.ref} class={styles.poolRow} classList={{ [styles.poolOver]: drop.isOver() }}>
      <For
        each={props.pool}
        fallback={<span class={styles.poolEmpty}>All scores assigned — drag one back here to unassign it.</span>}
      >
        {(value, index) => <PoolChip value={value} index={index()} disabled={props.disabled} />}
      </For>
    </div>
  );
};

/**
 * One ability's assigned base score: a drop target for pool chips and itself draggable,
 * so values can be swapped box→box or dragged back to the pool. Both are gated by
 * `disabled` rather than conditional creation (the method is reactive, and the
 * primitives must be created exactly once).
 */
export const ScoreCell: Component<{ statKey: AbilityKey; value: number; disabled: boolean }> = (props) => {
  const drop = createDroppable(() => ({
    id: `box:${props.statKey}`,
    type: "box",
    data: { kind: "box", statKey: props.statKey },
    disabled: props.disabled,
  }));
  const drag = createDraggable(() => ({
    id: `boxval:${props.statKey}`,
    type: "score",
    data: { kind: "box", statKey: props.statKey, value: props.value },
    disabled: props.disabled || props.value === 0,
  }));
  return (
    <div ref={drop.ref} class={styles.scoreCell} classList={{ [styles.scoreCellOver]: drop.isOver() }}>
      <span
        ref={drag.ref}
        class={styles.scoreChip}
        classList={{
          [styles.scoreChipEmpty]: props.value === 0,
          [styles.scoreChipDragging]: drag.isActive(),
        }}
      >
        {props.value === 0 ? "—" : props.value}
      </span>
    </div>
  );
};

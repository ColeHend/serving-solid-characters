import { Component, For, Show, createMemo } from "solid-js";
import { Button, NumberInput, Option, Select, TabBar } from "coles-solid-library";
import { AbilityGenMethod } from "../../../../../models/character.model";
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  AbilityKey,
  EXTENDED_STANDARD_ARRAY,
  POINT_BUY_BUDGET,
  POINT_BUY_COSTS,
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  STANDARD_ARRAY,
} from "../../rules/constants";
import { signed } from "../../../../../shared/customHooks/utility/tools/dndMath";
import {
  DragDropProvider,
  DragOverlay,
  pointerWithin,
  type DefaultDataMap,
  type DragEndEvent,
} from "../../../../../shared/dnd";
import { Stepper } from "../../shell/stepper";
import { useCreate } from "../../state/createContext";
import { AbilityBonusPanel } from "./abilityBonusPanel";
import { PoolZone, ScoreCell, ScoreDrag, ScoreDrop, remainingPool, resolveScoreDrop } from "./scoreBoard";
import styles from "./abilitiesSection.module.scss";

const METHODS: { label: string; method: AbilityGenMethod; hint: string }[] = [
  { label: "Standard Array", method: "standard", hint: `Assign ${STANDARD_ARRAY.join(", ")}.` },
  { label: "Extended Array", method: "extended", hint: `Assign ${EXTENDED_STANDARD_ARRAY.join(", ")}.` },
  { label: "Point Buy", method: "pointbuy", hint: `${POINT_BUY_BUDGET} points, scores ${POINT_BUY_MIN}–${POINT_BUY_MAX}.` },
  { label: "Roll 4d6", method: "roll", hint: "Roll 4d6 drop lowest, then assign the results." },
  { label: "Manual", method: "manual", hint: "Type any scores 3–20." },
];

export const AbilitiesSection: Component = () => {
  const { draft, actions, derived } = useCreate();

  const methodIndex = () => METHODS.findIndex((m) => m.method === draft.abilityMethod);
  const hint = () => METHODS[methodIndex()]?.hint ?? "";

  // Marker for the gap between the pre-mads score and the effective (post-mads) score:
  // signed delta for ASI-style boosts (or penalties), "set" when a mode:"set" mad forces
  // the value — decided by the mad's actual mode, not the direction of the gap.
  const abilityDelta = (key: AbilityKey): string | undefined => {
    const effective = derived.effectiveScores()[key];
    const base = derived.finalScores()[key];
    if (derived.setStats().has(key)) return effective === base ? undefined : "set";
    if (effective === base) return undefined;
    return signed(effective - base);
  };

  const assignedValues = () => ABILITY_KEYS.map((key) => draft.baseScores[key]);

  const isPoolMethod = () =>
    draft.abilityMethod === "standard" ||
    draft.abilityMethod === "extended" ||
    draft.abilityMethod === "roll";

  const activeArray = () => {
    if (draft.abilityMethod === "standard") return STANDARD_ARRAY;
    if (draft.abilityMethod === "extended") return EXTENDED_STANDARD_ARRAY;
    if (draft.abilityMethod === "roll") return draft.rolledPool;
    return [];
  };

  // The pool derives from baseScores, so swap/clear bookkeeping is automatic: a value
  // reappears here the moment no box holds it.
  const pool = createMemo(() => remainingPool(activeArray(), assignedValues()));

  const onDragEnd = (e: DragEndEvent<DefaultDataMap>) => {
    const result = resolveScoreDrop(e.active.data as ScoreDrag, e.over?.data as ScoreDrop | undefined);
    if (!result) return;
    if (result.type === "assign") actions.setBaseScore(result.key, result.value);
    else if (result.type === "swap") actions.swapBaseScores(result.a, result.b);
    else actions.setBaseScore(result.key, 0);
  };

  const pointBuySpent = createMemo(() =>
    ABILITY_KEYS.reduce((sum, key) => sum + (POINT_BUY_COSTS[draft.baseScores[key]] ?? 0), 0));

  /** Selectable values for one ability under the current method. */
  const optionsFor = (key: AbilityKey): number[] => {
    const current = draft.baseScores[key];
    if (isPoolMethod()) {
      const available = remainingPool(activeArray(), assignedValues());
      return [...new Set([...(current ? [current] : []), ...available])].sort((a, b) => b - a);
    }
    if (draft.abilityMethod === "pointbuy") {
      const budgetLeft = POINT_BUY_BUDGET - pointBuySpent() + (POINT_BUY_COSTS[current] ?? 0);
      const scores: number[] = [];
      for (let score = POINT_BUY_MIN; score <= POINT_BUY_MAX; score++) {
        if ((POINT_BUY_COSTS[score] ?? 0) <= budgetLeft) scores.push(score);
      }
      return scores.sort((a, b) => b - a);
    }
    return [];
  };

  return (
    <DragDropProvider
      collisionDetection={pointerWithin}
      onDragEnd={onDragEnd}
      announcements={{
        onDragStart: (e) => {
          const d = e.active.data as ScoreDrag | undefined;
          return d ? `Picked up score ${d.value}.` : "Picked up score.";
        },
        onDragOver: (e) => {
          const o = e.over?.data as ScoreDrop | undefined;
          if (!o) return "Not over a target.";
          return o.kind === "box" ? `Over the ${o.statKey} box.` : "Over the score pool.";
        },
        onDragEnd: (e) => {
          const d = e.active.data as ScoreDrag | undefined;
          const o = e.over?.data as ScoreDrop | undefined;
          if (!d || !o) return "Dropped.";
          if (o.kind === "box") return `Assigned ${d.value} to the ${o.statKey} box.`;
          return `Returned ${d.value} to the pool.`;
        },
        onDragCancel: () => "Cancelled drag.",
      }}
    >
    <div>
      <div class={styles.methodRow}>
        <TabBar
          tabs={METHODS.map((m) => m.label)}
          activeTab={methodIndex()}
          onTabChange={(_label: string, index: number) => actions.setAbilityMethod(METHODS[index].method)}
        />
        <span class={styles.hint}>{hint()}</span>
      </div>

      <Show when={draft.abilityMethod === "roll"}>
        <div class={styles.rollRow}>
          <Button onClick={() => actions.rollPool()}>Roll 4d6</Button>
          <Show when={draft.rolledPool.length > 0}>
            <span class={styles.hint}>Rolled: {draft.rolledPool.join(", ")}</span>
          </Show>
        </div>
      </Show>

      <Show when={isPoolMethod() && activeArray().length > 0}>
        <PoolZone pool={pool()} disabled={!isPoolMethod()} />
      </Show>

      <div class={styles.columns}>
        <For each={ABILITY_KEYS}>
          {(key) => (
            <div class={styles.column}>
              <span class={styles.abilityLabel}>{ABILITY_LABELS[key]}</span>
              <span class={styles.finalScore}>{derived.effectiveScores()[key]}</span>
              <span class={styles.modChip}>{signed(derived.effectiveMods()[key])}</span>
              <Show when={abilityDelta(key)}>
                {(delta) => <span class={styles.abilityDelta}>{delta()}</span>}
              </Show>

              <Show when={isPoolMethod()}>
                <ScoreCell statKey={key} value={draft.baseScores[key]} disabled={!isPoolMethod()} />
              </Show>

              <Show
                when={draft.abilityMethod !== "manual"}
                fallback={
                  <NumberInput
                    class={styles.manualInput}
                    value={draft.baseScores[key]}
                    min={3}
                    max={20}
                    hideSteppers
                    onInput={(e) => actions.setBaseScore(key, parseInt(e.currentTarget.value, 10) || 0)}
                  />
                }
              >
                <Select
                  value={draft.baseScores[key] ? `${draft.baseScores[key]}` : ""}
                  onChange={(value: string) => actions.setBaseScore(key, parseInt(value, 10) || 0)}
                  placeholder="—"
                >
                  <For each={optionsFor(key)}>{(score) => <Option value={`${score}`}>{score}</Option>}</For>
                </Select>
              </Show>

              <div class={styles.bonusRow}>
                <span class={styles.bonusLabel}>Bonus</span>
                <Stepper
                  label={signed(draft.bonusScores[key])}
                  onDecrement={() => actions.stepBonus(key, -1)}
                  onIncrement={() => actions.stepBonus(key, 1)}
                />
              </div>
            </div>
          )}
        </For>
      </div>

      <AbilityBonusPanel />
    </div>
    <DragOverlay>
      {(active) => {
        const d = active?.data as ScoreDrag | undefined;
        return d ? <span class={styles.dragOverlayChip}>{d.value}</span> : null;
      }}
    </DragOverlay>
    </DragDropProvider>
  );
};

import { Component, For, Show, createMemo, createSignal } from "solid-js";
import { Button, NumberInput, Option, Select, TabBar } from "coles-solid-library";
import { AbilityGenMethod } from "../../../../../models/character.model";
import {
  ABILITY_FULL_NAMES,
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
import { normalizeAbility } from "../../rules/engine";
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

  // 2024 background boost helper.
  const boostOptions = createMemo(() =>
    (derived.selectedBackground()?.abilityOptions ?? [])
      .map(normalizeAbility)
      .filter((key): key is AbilityKey => key !== undefined));
  const [plusTwo, setPlusTwo] = createSignal<AbilityKey | undefined>();
  const [plusOne, setPlusOne] = createSignal<AbilityKey | undefined>();

  const applyTwoOne = () => {
    const two = plusTwo() ?? boostOptions()[0];
    const one = plusOne() ?? boostOptions().find((key) => key !== two);
    if (!two || !one || two === one) return;
    actions.applyBackgroundBoost({ [two]: 2, [one]: 1 });
  };

  const applyThreeOnes = () => {
    actions.applyBackgroundBoost(Object.fromEntries(boostOptions().map((key) => [key, 1])));
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
              <span class={styles.finalScore}>{derived.finalScores()[key]}</span>
              <span class={styles.modChip}>{signed(derived.abilityMods()[key])}</span>

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
                  label={signed(draft.bonusScores[key] + (draft.backgroundBoosts[key] ?? 0))}
                  onDecrement={() => actions.stepBonus(key, -1)}
                  onIncrement={() => actions.stepBonus(key, 1)}
                />
              </div>
            </div>
          )}
        </For>
      </div>

      <Show when={draft.edition !== "2014" && boostOptions().length > 0}>
        <div class={styles.boostBar}>
          <span>
            Your {draft.background} background boosts{" "}
            {boostOptions().map((key) => ABILITY_FULL_NAMES[key]).join(", ")}.
          </span>
          <span class={styles.boostControls}>
            <Select
              value={(plusTwo() ?? boostOptions()[0]) as string}
              onChange={(value: string) => setPlusTwo(value as AbilityKey)}
            >
              <For each={boostOptions()}>
                {(key) => <Option value={key}>+2 {ABILITY_LABELS[key]}</Option>}
              </For>
            </Select>
            <Select
              value={(plusOne() ?? boostOptions().find((key) => key !== (plusTwo() ?? boostOptions()[0]))) as string}
              onChange={(value: string) => setPlusOne(value as AbilityKey)}
            >
              <For each={boostOptions()}>
                {(key) => <Option value={key}>+1 {ABILITY_LABELS[key]}</Option>}
              </For>
            </Select>
            <Button onClick={applyTwoOne}>Apply +2 / +1</Button>
            <Button onClick={applyThreeOnes}>Apply +1 +1 +1</Button>
            <Button transparent onClick={() => actions.clearBackgroundBoosts()}>
              Clear
            </Button>
          </span>
        </div>
      </Show>
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

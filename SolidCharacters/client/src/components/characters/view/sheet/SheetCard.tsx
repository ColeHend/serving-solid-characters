import { Component, For, JSX, Show } from "solid-js";
import { Container, Icon } from "coles-solid-library";
import { SkillOverrideState } from "../../../../models/character.model";
import styles from "./sheet.module.scss";

/** A themed surface card with a small uppercase icon+title header, matching the sheet mockups. */
export const SectionCard: Component<{
  icon?: string;
  title?: string;
  headerExtra?: JSX.Element;
  class?: string;
  children: JSX.Element;
}> = (props) => (
  <div class={`${styles.card} ${props.class ?? ""}`}>
    <Show when={props.title || props.icon}>
      <div class={styles.cardHeader}>
        <Show when={props.icon}>
          <Icon icon={props.icon} size="small" color="var(--primary-color)" />
        </Show>
        <span class={styles.cardTitle}>{props.title}</span>
        <Show when={props.headerExtra}>
          <span class={styles.headerExtra}>{props.headerExtra}</span>
        </Show>
      </div>
    </Show>
    {props.children}
  </div>
);

/** A single proficiency-dot + label (+ optional ability tag) + signed value row (saves & skills). */
export const StatPill: Component<{
  state: SkillOverrideState;
  label: string;
  sub?: string;
  value: string;
  onClick?: () => void;
}> = (props) => (
  <div
    class={styles.statPill}
    classList={{ [styles.clickable]: !!props.onClick }}
    onClick={() => props.onClick?.()}
  >
    <span class={`${styles.profDot} ${styles[`dot_${props.state}`]}`} />
    <span class={styles.pillLabel}>{props.label}</span>
    <Show when={props.sub}>
      <span class={styles.pillSub}>{props.sub}</span>
    </Show>
    <span class={styles.pillValue}>{props.value}</span>
  </div>
);

/**
 * A left-to-right pip tracker (spell slots, death saves, resource uses). `filled` pips render
 * solid; clicking pip `i` reports the new filled count (drag-fill semantics) via `onToggle`.
 */
export const PipRow: Component<{
  total: number;
  filled: number;
  shape?: "diamond" | "circle";
  tone?: "primary" | "success" | "fail";
  onToggle?: (newFilled: number) => void;
}> = (props) => {
  const shapeClass = () => (props.shape === "circle" ? styles.pipCircle : styles.pipDiamond);
  const toneClass = () =>
    props.tone === "fail" ? styles.pipFail : props.tone === "success" ? styles.pipSuccess : "";
  return (
    <div class={styles.pipRow}>
      <For each={Array.from({ length: props.total }, (_, i) => i)}>
        {(i) => (
          <span
            class={`${styles.pip} ${shapeClass()} ${toneClass()}`}
            classList={{
              [styles.pipFilled]: i < props.filled,
              [styles.clickable]: !!props.onToggle,
            }}
            onClick={() => props.onToggle?.(i < props.filled ? i : i + 1)}
          />
        )}
      </For>
    </div>
  );
};

/** A small labelled value tile (AC / Initiative / Speed / Proficiency, and the spellcasting header). */
export const MiniStat: Component<{
  value: JSX.Element;
  label: string;
  sub?: string;
  icon?: string;
}> = (props) => (
  <Container theme="surface" class={styles.miniCard}>
    <div class={styles.miniValue}>{props.value}</div>
    <div class={styles.miniLabel}>
      <Show when={props.icon}>
        <Icon icon={props.icon} size="small" color="var(--primary-color)" />
      </Show>
      {props.label}
    </div>
    <Show when={props.sub}>
      <div class={styles.miniSub}>{props.sub}</div>
    </Show>
  </Container>
);

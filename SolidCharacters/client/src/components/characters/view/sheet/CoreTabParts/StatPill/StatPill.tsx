import { SkillOverrideState } from "../../../../../../models/character.model";
import { Component, Show } from "solid-js";
import styles from "../../sheet.module.scss";

interface props {
  state: SkillOverrideState;
  label: string;
  sub?: string;
  value: string;
  onClick?: () => void;
}

/** A single proficiency-dot + label (+ optional ability tag) + signed value row (saves & skills). */
export const StatPill: Component<props> = (props) => (
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

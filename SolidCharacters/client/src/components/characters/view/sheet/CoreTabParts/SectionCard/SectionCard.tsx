import { Component, JSX, Show } from "solid-js";
import { Icon } from "coles-solid-library";
import styles from "../../sheet.module.scss";

interface props {
  icon?: string;
  title?: string;
  headerExtra?: JSX.Element;
  class?: string;
  children: JSX.Element;
}

export const SectionCard: Component<props> = (props) => (
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
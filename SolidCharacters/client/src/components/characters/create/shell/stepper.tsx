import { Component, JSX } from "solid-js";
import styles from "./stepper.module.scss";

interface StepperProps {
  /** Rendered between the − and + buttons, e.g. "Lv 3" or "+2". */
  label: JSX.Element;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementDisabled?: boolean;
  incrementDisabled?: boolean;
}

/** The − label + control used for class levels and ability bonuses. */
export const Stepper: Component<StepperProps> = (props) => (
  <span class={styles.stepper}>
    <button
      type="button"
      class={styles.button}
      onClick={props.onDecrement}
      disabled={props.decrementDisabled}
      aria-label="decrease"
    >
      −
    </button>
    <span class={styles.label}>{props.label}</span>
    <button
      type="button"
      class={styles.button}
      onClick={props.onIncrement}
      disabled={props.incrementDisabled}
      aria-label="increase"
    >
      +
    </button>
  </span>
);

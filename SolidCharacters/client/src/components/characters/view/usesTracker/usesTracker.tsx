import { Component, For } from "solid-js";
import { Checkbox } from "coles-solid-library";
import styles from "./usesTracker.module.scss";

type Props = {
  featureName: string;
  max: number;
  recharge: string;
  /** How many uses are currently spent (checked pips). */
  spent: number;
  onChange?: (spent: number) => void;
};

/** Spendable pips for a limited-use feature: checked = spent, reset via the rest buttons. */
const UsesTracker: Component<Props> = (props) => {

  return <div class={styles.usesTracker}>
    <span class={styles.label}>Uses ({props.recharge}):</span>
    <For each={Array.from({ length: props.max ?? 0 }, (_, i) => i)}>
      {(i) => (
        <input type="checkbox"
          // ariaLabel={`${props.featureName} use ${i + 1}`}
          // checked={i < (props.spent ?? 0)}
          // onChange={(checked) => props.onChange(checked ? i + 1 : i)}
        />
      )}
    </For>
  </div>
};

export default UsesTracker;

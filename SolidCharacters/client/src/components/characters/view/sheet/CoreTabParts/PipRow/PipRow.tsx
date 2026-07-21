import { Component, For } from "solid-js";
import styles from "../../sheet.module.scss";

interface props {
  total: number;
  filled: number;
  shape?: "diamond" | "circle";
  tone?: "primary" | "success" | "fail";
  onToggle?: (newFilled: number) => void;
}

/**
 * A left-to-right pip tracker (spell slots, death saves, resource uses). `filled` pips render
 * solid; clicking pip `i` reports the new filled count (drag-fill semantics) via `onToggle`.
 */
export const PipRow: Component<props> = (props) => {
  const shapeClass = () => (props.shape === "circle" ? styles.pipCircle : styles.pipDiamond);
  const toneClass = () => props.tone === "fail" ? styles.pipFail : props.tone === "success" ? styles.pipSuccess : "";
  
    return <div class={styles.pipRow}>
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
};

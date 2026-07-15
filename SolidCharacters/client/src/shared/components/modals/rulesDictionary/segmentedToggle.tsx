import { Component, For } from "solid-js";
import styles from "./rulesDictionary.module.scss";

export interface SegmentedOption {
  key: string;
  label: string;
}

/**
 * Segmented pill toggle (a radiogroup) used for the dictionary's edition filters. Roving
 * tabindex: only the active segment is tabbable; arrow keys / Home / End move focus AND select.
 */
export const SegmentedToggle: Component<{
  options: SegmentedOption[];
  value: string;
  onChange: (key: string) => void;
  ariaLabel?: string;
  class?: string;
}> = (props) => {
  let root: HTMLDivElement | undefined;

  const moveTo = (index: number) => {
    const n = props.options.length;
    const opt = props.options[((index % n) + n) % n];
    if (!opt) return;
    props.onChange(opt.key);
    root?.querySelectorAll("button")[((index % n) + n) % n]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown": e.preventDefault(); moveTo(index + 1); break;
      case "ArrowLeft":
      case "ArrowUp": e.preventDefault(); moveTo(index - 1); break;
      case "Home": e.preventDefault(); moveTo(0); break;
      case "End": e.preventDefault(); moveTo(props.options.length - 1); break;
    }
  };

  return (
    <div ref={root} role="radiogroup" aria-label={props.ariaLabel} class={`${styles.seg} ${props.class ?? ""}`}>
      <For each={props.options}>{(opt, i) => (
        <button
          type="button"
          role="radio"
          aria-checked={props.value === opt.key}
          tabIndex={props.value === opt.key ? 0 : -1}
          class={styles.segOption}
          classList={{ [styles.segActive]: props.value === opt.key }}
          onClick={() => props.onChange(opt.key)}
          onKeyDown={(e) => onKeyDown(e, i())}
        >
          {opt.label}
        </button>
      )}</For>
    </div>
  );
};

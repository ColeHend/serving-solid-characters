import { For, JSX } from "solid-js";
import { Button } from "coles-solid-library";
import styles from "./featuresPopup.module.scss";

interface SegmentedToggleProps<T extends string | number> {
    options: { label: string; value: T }[];
    value: T | undefined;
    onChange: (value: T) => void;
    ariaLabel?: string;
}

/** Two-or-more option pill toggle (Add/Remove, Character/Info). */
export function SegmentedToggle<T extends string | number>(props: SegmentedToggleProps<T>): JSX.Element {
    return (
        <div class={styles.segmented} role="group" aria-label={props.ariaLabel}>
            <For each={props.options}>
                {(opt) => (
                    <Button
                        class={`${styles.segmentBtn} ${props.value === opt.value ? styles.segmentBtnActive : ""}`}
                        aria-pressed={props.value === opt.value}
                        onClick={() => props.onChange(opt.value)}
                    >
                        {opt.label}
                    </Button>
                )}
            </For>
        </div>
    );
}

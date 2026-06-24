import { Component, Show, createSignal } from "solid-js";
import { Icon } from "coles-solid-library";
import { Add, Remove } from "coles-solid-library/icons";
import { Markdown } from "../../shared/components/MarkDown/MarkDown";
import styles from "./SparkSidebar.module.scss";

/**
 * Collapsible reasoning ("thinking") shown above an assistant answer, like major model UIs.
 * Open by default while a turn is live; collapsed once the message is complete.
 */
const ThinkingBlock: Component<{ text: string; live?: boolean }> = (props) => {
    const [open, setOpen] = createSignal(!!props.live);
    return (
        <div class={styles.thinkingBlock}>
            <button type="button" class={styles.thinkingToggle} onClick={() => setOpen((o) => !o)}>
                <Icon icon={open() ? Remove : Add} size="small" />
                {props.live ? "Thinking…" : "Thoughts"}
            </button>
            <Show when={open()}>
                <div class={styles.thinkingContent}><Markdown text={props.text} /></div>
            </Show>
        </div>
    );
};

export default ThinkingBlock;

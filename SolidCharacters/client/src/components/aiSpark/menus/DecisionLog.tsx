import { Component, For, Show, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { Button, Icon } from "coles-solid-library";
import { Assignment, Close } from "coles-solid-library/icons";
import useClickOutside from "solid-click-outside";
import { decisionLog, ensureDecisionLogLoaded } from "../../../shared/customHooks/decisionLogManager";
import { relativeTime } from "../aiSpark.shared";
import { kindLabelLower } from "../../../shared/ai/refs/homebrewKind";
import styles from "../SparkSidebar.module.scss";

/**
 * A read-only log of the create/edit changes Grimoire has committed to homebrew, opened from the header.
 * Rendered as a hand-rolled in-sidebar popover (NOT the coles Modal): the Modal portals to <body> at
 * z-index 1001, which renders BEHIND the z-index:1200 Grimoire sidebar (fully hidden on mobile). A popover
 * inside the sidebar shares its stacking context and stays visible. Uses a distinct icon (Assignment)
 * so it isn't confused with the Conversations History trigger beside it.
 */
const DecisionLog: Component = () => {
    const [show, setShow] = createSignal(false);
    const [rootRef, setRootRef] = createSignal<HTMLDivElement>();
    let dialog: HTMLDivElement | undefined;

    onMount(() => { void ensureDecisionLogLoaded(); });
    useClickOutside(rootRef, () => setShow(false));

    const open = () => { void ensureDecisionLogLoaded(); setShow(true); };

    // Escape-to-close while open, and move focus into the panel for keyboard/AT users.
    createEffect(() => {
        if (!show()) return;
        queueMicrotask(() => dialog?.focus());
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShow(false); };
        document.addEventListener("keydown", onKey);
        onCleanup(() => document.removeEventListener("keydown", onKey));
    });

    return (
        <div class={styles.logMenu} ref={setRootRef}>
            <Show when={show()}>
                <div ref={dialog} tabindex={-1} class={styles.logPopover} role="dialog" aria-label="Decision log">
                    <div class={styles.logPopoverHead}>
                        <strong>Decision log</strong>
                        <Button transparent title="Close decision log" aria-label="Close decision log" onClick={() => setShow(false)}>
                            <Icon icon={Close} size="small" />
                        </Button>
                    </div>
                    <div class={styles.decisionLog}>
                        <Show
                            when={decisionLog().length}
                            fallback={<div class={styles.empty}>No changes logged yet. Saved AI edits and creations appear here.</div>}
                        >
                            <For each={decisionLog()}>
                                {(e) => (
                                    <div class={styles.logEntry}>
                                        <div class={styles.logHead}>
                                            <span class={styles.logChip} data-type={e.changeType}>{e.changeType}</span>
                                            <strong>{e.entityName}</strong>
                                            <span class={styles.logKind}>{kindLabelLower(e.entityKind)}</span>
                                            <span class={styles.logTime}>{relativeTime(e.timestamp)}</span>
                                        </div>
                                        <div class={styles.logSummary}>{e.summary}</div>
                                    </div>
                                )}
                            </For>
                        </Show>
                    </div>
                </div>
            </Show>
            <Button transparent title="Decision log" aria-label="Decision log" aria-haspopup="dialog" aria-expanded={show()} onClick={open}>
                <Icon icon={Assignment} size="small" />
            </Button>
        </div>
    );
};

export default DecisionLog;

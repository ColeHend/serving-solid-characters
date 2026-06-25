import { Component, For, Show, createSignal, onMount } from "solid-js";
import { Button, Icon, Modal } from "coles-solid-library";
import { History } from "coles-solid-library/icons";
import { decisionLog, ensureDecisionLogLoaded } from "../../shared/customHooks/decisionLogManager";
import { relativeTime } from "./aiSpark.shared";
import styles from "./SparkSidebar.module.scss";

/** A read-only log of the create/edit changes Spark has committed to homebrew, opened from the header. */
const DecisionLog: Component = () => {
    const [show, setShow] = createSignal(false);
    onMount(() => { void ensureDecisionLogLoaded(); });

    const open = () => { void ensureDecisionLogLoaded(); setShow(true); };

    return (
        <>
            <Button transparent title="Decision log" onClick={open}>
                <Icon icon={History} size="small" />
            </Button>
            <Modal title="Decision log" show={[show, setShow]}>
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
                                        <span class={styles.logKind}>{e.entityKind.replace("_", " ")}</span>
                                        <span class={styles.logTime}>{relativeTime(e.timestamp)}</span>
                                    </div>
                                    <div class={styles.logSummary}>{e.summary}</div>
                                </div>
                            )}
                        </For>
                    </Show>
                </div>
            </Modal>
        </>
    );
};

export default DecisionLog;

import { Component, For, Show } from "solid-js";
import { FlatCard } from "../../../shared/components/flatCard/flatCard";
import { ReviewSeverity } from "../../../shared/ai/readiness/types";
import { HomebrewPreview } from "../aiSpark.shared";
import styles from "../SparkSidebar.module.scss";

const severityClass: Record<ReviewSeverity, string> = {
    error: styles.issueError,
    warning: styles.issueWarning,
    info: styles.issueInfo,
};

// Non-color severity cue so the distinction survives for color-blind users / failed contrast (WCAG 1.4.1).
const severityLabel: Record<ReviewSeverity, string> = {
    error: "Error",
    warning: "Warning",
    info: "Info",
};

/**
 * Collapsible list of readiness-review findings for a generated entity. Groups issues by the pass that
 * raised them; severity drives color (error red, warning amber, info muted). Display-only — the card
 * decides whether Save is blocked (preview.reviewBlocked).
 */
const ReviewVerdicts: Component<{ preview: HomebrewPreview }> = (props) => {
    const flagged = () => (props.preview.verdicts ?? []).filter(v => v.issues.length > 0);
    const count = () => flagged().reduce((n, v) => n + v.issues.length, 0);

    return (
        <Show when={flagged().length}>
            <FlatCard
                transparent
                getRidOfTopBorder
                getRidOfBottomBorder
                startOpen={props.preview.reviewBlocked}
                headerName={
                    <span class={props.preview.reviewBlocked ? styles.previewError : styles.completenessHeader}>
                        {props.preview.reviewBlocked ? "⛔" : "⚠"} Review found {count()} issue{count() === 1 ? "" : "s"}
                    </span>
                }
            >
                <div class={styles.verdictList}>
                    <For each={flagged()}>{(v) => (
                        <div class={styles.verdictGroup}>
                            <div class={styles.verdictLabel}>{v.label}</div>
                            <ul class={styles.completenessList}>
                                <For each={v.issues}>{(issue) => (
                                    <li class={severityClass[issue.severity]}>
                                        <strong>{severityLabel[issue.severity]}:</strong> {issue.message}
                                        <Show when={issue.suggestedFix}>
                                            <div class={styles.issueFix}>Fix: {issue.suggestedFix}</div>
                                        </Show>
                                    </li>
                                )}</For>
                            </ul>
                        </div>
                    )}</For>
                </div>
            </FlatCard>
        </Show>
    );
};

export default ReviewVerdicts;

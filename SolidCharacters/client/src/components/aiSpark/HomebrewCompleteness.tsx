import { Component, For, Show } from "solid-js";
import { FlatCard } from "../../shared/components/flatCard/flatCard";
import { HomebrewPreview } from "./aiSpark.shared";
import styles from "./SparkSidebar.module.scss";

/**
 * Collapsible list of recommended-but-empty fields the AI left off a generated entity. Warn-only —
 * these never block Save; they just make the gaps visible so the user can fill them or ask the AI to.
 */
const HomebrewCompleteness: Component<{ preview: HomebrewPreview }> = (props) => {
    const warnings = () => props.preview.warnings ?? [];
    return (
        <Show when={warnings().length}>
            <FlatCard
                transparent
                getRidOfTopBorder
                getRidOfBottomBorder
                startOpen={false}
                headerName={
                    <span class={styles.completenessHeader}>
                        ⚠ {warnings().length} suggestion{warnings().length === 1 ? "" : "s"} to make this more complete
                    </span>
                }
            >
                <ul class={styles.completenessList}>
                    <For each={warnings()}>{(w) => <li class={styles.warnChip}>{w}</li>}</For>
                </ul>
            </FlatCard>
        </Show>
    );
};

export default HomebrewCompleteness;

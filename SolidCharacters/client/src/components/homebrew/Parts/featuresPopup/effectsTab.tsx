import { Component, ErrorBoundary, For, Show, createMemo } from "solid-js";
import { Button } from "coles-solid-library";
import { EffectCard } from "./effectCard";
import { EffectCardData, MadsApi, PrereqFormArray, PrereqState, usageOwnedIndices } from "./featuresPopup.shared";
import styles from "./featuresPopup.module.scss";

interface EffectsTabProps {
    api: MadsApi;
    data: EffectCardData;
    prereqForm: PrereqFormArray;
    prereqs: PrereqState;
}

export const EffectsTab: Component<EffectsTabProps> = (props) => {
    // Rows the Usage & spells tab owns (first AddUses + concrete AddSpells) are
    // hidden here; everything else keeps its original FormArray index.
    const visible = createMemo(() => {
        const rows = props.api.rows();
        const owned = usageOwnedIndices(rows);
        return rows.map((row, index) => ({ row, index })).filter(({ index }) => !owned.has(index));
    });

    return (
        <div>
            <div class={styles.effectsHead}>
                <span class={styles.effectsHelper}>Effects run automatically when the feature is gained.</span>
                <Button class={styles.addEffectBtn} onClick={() => props.api.addMadRow()}>
                    + Add effect
                </Button>
            </div>

            <Show
                when={visible().length > 0}
                fallback={
                    <div class={styles.emptyState}>
                        No effects yet. Effects apply changes automatically — grant spells, raise AC, add attacks, and more.
                    </div>
                }
            >
                <For each={visible()}>
                    {(item) => (
                        <ErrorBoundary
                            fallback={(err) => (
                                <div class={styles.emptyState}>
                                    This effect failed to render: {err instanceof Error ? err.message : String(err)}
                                </div>
                            )}
                        >
                            <EffectCard
                                row={item.row}
                                index={item.index}
                                api={props.api}
                                data={props.data}
                                prereqForm={props.prereqForm}
                                prereqs={props.prereqs}
                                onDelete={() => props.api.removeMad(item.index)}
                            />
                        </ErrorBoundary>
                    )}
                </For>
            </Show>
        </div>
    );
};

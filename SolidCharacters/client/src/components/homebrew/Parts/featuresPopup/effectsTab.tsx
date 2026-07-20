import { Component, ErrorBoundary, For, Show, createMemo } from "solid-js";
import { Button } from "coles-solid-library";
import { EffectCard } from "./effectCard";
import { BranchHeader } from "./branchHeader";
import { EffectCardData, MadsApi, PrereqFormArray, PrereqState, branchLabel, branchNumbers, usageOwnedIndices } from "./featuresPopup.shared";
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

    // Cards cluster by branch: group-0 rows always apply; each nonzero group is a
    // mutually-exclusive branch the player picks between on the sheet.
    const branches = createMemo(() => branchNumbers(props.api.rows()));
    const alwaysRows = createMemo(() => visible().filter(({ row }) => (Number(row.group) || 0) === 0));
    const branchRows = (group: number) => visible().filter(({ row }) => (Number(row.group) || 0) === group);

    // Renaming a branch writes the label onto every row in it (the label rides in value.groupLabel).
    const renameBranch = (group: number, label: string) => {
        props.api.rows().forEach((row, index) => {
            if ((Number(row.group) || 0) !== group) return;
            props.api.setMadFeature("value", index, { ...(row.value ?? {}), groupLabel: label });
        });
    };

    const card = (item: { row: ReturnType<MadsApi["rows"]>[number]; index: number }) => (
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
    );

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
                <Show when={branches().length > 0 && alwaysRows().length > 0}>
                    <span class={styles.sectionLabel}>Always applied</span>
                </Show>
                <For each={alwaysRows()}>{card}</For>

                <Show when={branches().length > 0}>
                    <span class={styles.sectionLabel}>Branches — the player picks one</span>
                </Show>
                <For each={branches()}>
                    {(group) => (
                        <div class={styles.branchSection}>
                            <BranchHeader
                                group={group}
                                label={branchLabel(props.api.rows(), group)}
                                onRename={(label) => renameBranch(group, label)}
                            />
                            <For each={branchRows(group)}>{card}</For>
                        </div>
                    )}
                </For>
            </Show>
        </div>
    );
};

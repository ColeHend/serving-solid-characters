import { Component, For, Show } from "solid-js";
import { Button, Icon, Input } from "coles-solid-library";
import { Delete } from "coles-solid-library/icons";
import { EffectCardData } from "../../featuresPopup.shared";
import { OptionCard } from "./optionCard";
import { OptionScalingRow, OptionsApi } from "./optionsFeature.shared";
import popupStyles from "../../featuresPopup.module.scss";
import styles from "./optionsFeature.module.scss";

interface OptionsTabProps {
    api: OptionsApi;
    data: EffectCardData;
}

/**
 * The "Options" tab: named sub-options the player picks N of on the sheet (Eldritch
 * Invocations, Battle Master Maneuvers, Metamagic, Fighting Styles…). The pick count is
 * either a flat number or "at level L you know N" milestones that scale with the owning
 * class's level.
 */
export const OptionsTab: Component<OptionsTabProps> = (props) => {
    const config = () => props.api.config();
    const rows = () => props.api.rows();

    const setScalingRow = (index: number, patch: Partial<OptionScalingRow>) => {
        props.api.setConfig({
            scalingRows: config().scalingRows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
        });
    };

    return (
        <div>
            <div class={popupStyles.effectsHead}>
                <span class={popupStyles.effectsHelper}>
                    Named picks the player chooses from — invocations, maneuvers, metamagic. Options without a name are dropped on save.
                </span>
                <Button class={popupStyles.addEffectBtn} onClick={() => props.api.addRow()}>
                    + Add option
                </Button>
            </div>

            <Show
                when={rows().length > 0}
                fallback={
                    <div class={popupStyles.emptyState}>
                        No options yet. Add one per choosable pick — each option carries its own description, prerequisites, and effects.
                    </div>
                }
            >
                <div class={styles.configCard}>
                    <span class={popupStyles.sectionLabel}>How picking works</span>
                    <div class={styles.configRow}>
                        <div>
                            <label class={popupStyles.label}>What is one pick called?</label>
                            <div class={popupStyles.underlineField}>
                                <Input
                                    transparent
                                    value={config().label}
                                    onInput={(e) => props.api.setConfig({ label: e.currentTarget.value })}
                                    placeholder="e.g. Invocation, Maneuver"
                                />
                            </div>
                        </div>
                        <Show when={config().scalingRows.length === 0}>
                            <div>
                                <label class={popupStyles.label}>How many the player picks</label>
                                <div class={popupStyles.underlineField}>
                                    {/* type=number fires onChange only (never onInput) in the coles Input. */}
                                    <Input
                                        transparent
                                        type="number"
                                        min={1}
                                        value={config().count}
                                        onChange={(e) => props.api.setConfig({ count: e.currentTarget.value })}
                                        aria-label="How many the player picks"
                                    />
                                </div>
                            </div>
                        </Show>
                    </div>

                    <For each={config().scalingRows}>
                        {(row, index) => (
                            <div class={styles.scalingRow}>
                                <span class={styles.scalingText}>At level</span>
                                <Input
                                    transparent
                                    type="number"
                                    min={1}
                                    class={styles.scalingInput}
                                    value={row.level}
                                    onChange={(e) => setScalingRow(index(), { level: e.currentTarget.value })}
                                    aria-label="Milestone level"
                                />
                                <span class={styles.scalingText}>the player knows</span>
                                <Input
                                    transparent
                                    type="number"
                                    min={0}
                                    class={styles.scalingInput}
                                    value={row.count}
                                    onChange={(e) => setScalingRow(index(), { count: e.currentTarget.value })}
                                    aria-label="Options known at this level"
                                />
                                <Button
                                    transparent
                                    class={popupStyles.deleteBtn}
                                    aria-label="Remove level milestone"
                                    onClick={() =>
                                        props.api.setConfig({
                                            scalingRows: config().scalingRows.filter((_, i) => i !== index()),
                                        })}
                                >
                                    <Icon icon={Delete} />
                                </Button>
                            </div>
                        )}
                    </For>
                    <Button
                        class={popupStyles.addEffectBtn}
                        onClick={() =>
                            props.api.setConfig({ scalingRows: [...config().scalingRows, { level: "", count: "" }] })}
                    >
                        + Add level milestone
                    </Button>
                    <Show when={config().scalingRows.length > 0}>
                        <span class={styles.scalingHint}>
                            Milestones scale the pick count with the owning class's level and replace the flat count.
                        </span>
                    </Show>
                </div>

                <For each={rows()}>
                    {(row) => (
                        <OptionCard
                            row={row}
                            api={props.api}
                            data={props.data}
                        />
                    )}
                </For>
            </Show>
        </div>
    );
};

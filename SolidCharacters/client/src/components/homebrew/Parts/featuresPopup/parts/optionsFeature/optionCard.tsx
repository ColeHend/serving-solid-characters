import { Component } from "solid-js";
import { Button, Icon, Input, TextArea } from "coles-solid-library";
import { Delete } from "coles-solid-library/icons";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";
import { EffectCardData } from "../../featuresPopup.shared";
import { EffectsTab } from "../../effectsTab";
import { OptionRow, OptionsApi } from "./optionsFeature.shared";
import popupStyles from "../../featuresPopup.module.scss";
import styles from "./optionsFeature.module.scss";

interface OptionCardProps {
    row: OptionRow;
    api: OptionsApi;
    data: EffectCardData;
}

/**
 * One authorable option: name, description, simple prerequisites, and a nested effects
 * editor — the full EffectsTab running against this option's own scoped FormArray, so
 * option effects get the same per-category editors as feature effects.
 */
export const OptionCard: Component<OptionCardProps> = (props) => {
    const update = (patch: Parameters<OptionsApi["updateRow"]>[1]) => props.api.updateRow(props.row.key, patch);

    return (
        <FlatCard
            headerName={<span class={styles.optionCardTitle}>{props.row.name.trim() || "New option"}</span>}
            startOpen={props.row.fresh}
            extraHeaderJsx={
                <Button
                    transparent
                    class={popupStyles.deleteBtn}
                    aria-label="Delete option"
                    onClick={() => props.api.removeRow(props.row.key)}
                >
                    <Icon icon={Delete} />
                </Button>
            }
        >
            <div class={styles.optionFields}>
                <label class={popupStyles.label}>Name</label>
                <div class={popupStyles.underlineField}>
                    <Input
                        transparent
                        value={props.row.name}
                        onInput={(e) => update({ name: e.currentTarget.value })}
                        placeholder="e.g. Agonizing Blast, Riposte, Careful Spell..."
                    />
                </div>

                <label class={popupStyles.label}>Description</label>
                <div class={popupStyles.underlineField}>
                    <TextArea
                        transparent
                        text={() => props.row.description}
                        setText={(v) => update({ description: v.toString() })}
                        placeholder="What this option does on the sheet."
                    />
                </div>

                <span class={popupStyles.sectionLabel}>Prerequisites (optional)</span>
                <div class={styles.prereqGrid}>
                    <div>
                        <label class={popupStyles.label}>Minimum level</label>
                        <div class={popupStyles.underlineField}>
                            {/* type=number fires onChange only (never onInput) in the coles Input. */}
                            <Input
                                transparent
                                type="number"
                                min={1}
                                value={props.row.minLevel}
                                onChange={(e) => update({ minLevel: e.currentTarget.value })}
                                aria-label="Minimum level"
                            />
                        </div>
                    </div>
                    <div>
                        <label class={popupStyles.label}>Requires feature</label>
                        <div class={popupStyles.underlineField}>
                            <Input
                                transparent
                                value={props.row.requiredFeature}
                                onInput={(e) => update({ requiredFeature: e.currentTarget.value })}
                                placeholder="e.g. Pact of the Blade"
                            />
                        </div>
                    </div>
                    <div>
                        <label class={popupStyles.label}>Shown as</label>
                        <div class={popupStyles.underlineField}>
                            <Input
                                transparent
                                value={props.row.prereqText}
                                onInput={(e) => update({ prereqText: e.currentTarget.value })}
                                placeholder="e.g. 5th level, Pact of the Blade feature"
                            />
                        </div>
                    </div>
                </div>

                <div class={styles.optionEffects}>
                    <EffectsTab
                        api={props.api.madsApiFor(props.row)}
                        data={props.data}
                        helperText="Effects apply while this option is chosen."
                    />
                </div>
            </div>
        </FlatCard>
    );
};

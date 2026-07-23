import { Select, Checkbox, Option } from "coles-solid-library";
import { Accessor, Component, createMemo, For, Index, runWithOwner, Show } from "solid-js";
import { FeatureDetail } from "../../../../../../../../shared";
import { 
    choiceStatMads, 
    statChoiceCount, 
    statChoicePicks, 
    statChoiceKey, 
    statChoiceOptions, 
    choiceProficiencyMads, 
    proficiencyChoiceCount, 
    proficiencyChoiceOptions, 
    choiceExpertiseMads, 
    expertiseChoiceCount, 
    expertiseChoiceKey, 
    expertiseChoiceOptions 
} from "../../../../../../../../shared/customHooks/mads/useMadCharacters";
import { Character } from "../../../../../../../../models/character.model";
import { SheetDerived } from "../../../../useSheetDerived";
import styles from "../../../../sheet.module.scss";

interface props {
    derived: Accessor<SheetDerived>;
    currentCharacter: Accessor<Character | undefined>;
    displayCharacter: Accessor<Character | undefined>;
    allFeatures: Accessor<FeatureDetail[]>;
    chooseStatAt: (featureKey: string, index: number, statKey: string, count: number) => void;
    toggleProficiencyPick: (featureKey: string, skill: string, count: number) => void;
    proficiencyPicks: (featureKey: string) => string[];
    feature: FeatureDetail
    statLabels: Accessor<Record<string, string>>;
}

export const FeatureChoices:Component<props> = (props) => {
    const STAT_LABELS = createMemo(() => props.statLabels());

    return <>
        <For each={choiceStatMads(props.feature)}>
            {(mad) => {
            const count = statChoiceCount(mad);
            const picks = () => statChoicePicks(props.currentCharacter()?.statChoices?.[statChoiceKey(props.feature)], count);
            const label = count > 1
                ? `+${mad.value?.["statValue"] ?? ""} to ${count} abilities of your choice:`
                : `${mad.value?.["mode"] === "set" ? "Set" : "+"}${mad.value?.["statValue"] ?? ""} to an ability of your choice:`;
            return (
                <div class={styles.choiceBlock}>
                <span>{label}</span>
                <Index each={picks()}>
                    {(pick, i) => (
                    <Select
                        value={pick()}
                        onChange={(val: string) => runWithOwner(null, () => {
                        if (val && val !== pick()) props.chooseStatAt(statChoiceKey(props.feature), i, val, count);
                        })}
                    >
                        <For each={statChoiceOptions(mad)}>
                        {(key) => <Option value={key}>{STAT_LABELS()[key] ?? key}</Option>}
                        </For>
                    </Select>
                    )}
                </Index>
                </div>
            );
            }}
        </For>
        <For each={choiceProficiencyMads(props.feature)}>
            {(mad) => {
            const count = proficiencyChoiceCount(mad);
            const key = () => statChoiceKey(props.feature);
            return (
                <div class={styles.choiceBlock}>
                <span>{`Skill proficiency — choose ${count} (${props.proficiencyPicks(key()).length}/${count}):`}</span>
                <div class={styles.choiceChips}>
                    <For each={proficiencyChoiceOptions(mad)}>
                    {(skill) => (
                        <Checkbox
                        label={skill}
                        checked={props.proficiencyPicks(key()).includes(skill)}
                        onChange={() => runWithOwner(null, () => props.toggleProficiencyPick(key(), skill, count))}
                        />
                    )}
                    </For>
                </div>
                </div>
            );
            }}
        </For>
        <For each={choiceExpertiseMads(props.feature)}>
            {(mad) => {
            const count = expertiseChoiceCount(mad);
            const key = () => expertiseChoiceKey(props.feature);
            const options = () => {
                const skills = props.displayCharacter()?.proficiencies?.skills ?? {};
                const allowed = expertiseChoiceOptions(mad).filter((skill) => skills[skill]?.proficient);
                return [...new Set([...allowed, ...props.proficiencyPicks(key())])];
            };
            return (
                <div class={styles.choiceBlock}>
                <span>{`Expertise — choose ${count} (${props.proficiencyPicks(key()).length}/${count}):`}</span>
                <div class={styles.choiceChips}>
                    <For each={options()}>
                    {(skill) => (
                        <Checkbox
                        label={skill}
                        checked={props.proficiencyPicks(key()).includes(skill)}
                        onChange={() => runWithOwner(null, () => props.toggleProficiencyPick(key(), skill, count))}
                        />
                    )}
                    </For>
                    <Show when={options().length === 0}><span>No eligible proficient skills yet</span></Show>
                </div>
                </div>
            );
            }}
        </For>
    </>
}
import { Select, Checkbox, FlatCard, Option } from "coles-solid-library";
import { Badge } from "coles-solid-library/icons";
import { For, Index, runWithOwner, Show, createMemo, Component, Accessor } from "solid-js";
import { FeatureDetail } from "../../../../../../shared";
import { featureUsage } from "../../../../../../shared/customHooks/mads/commands/useUsesFeature";
import { choiceStatMads, statChoiceCount, statChoicePicks, statChoiceKey, statChoiceOptions, choiceProficiencyMads, proficiencyChoiceCount, proficiencyChoiceOptions, choiceExpertiseMads, expertiseChoiceCount, expertiseChoiceKey, expertiseChoiceOptions } from "../../../../../../shared/customHooks/mads/useMadCharacters";
import { SectionCard } from "../SectionCard/SectionCard";
import styles from "../../sheet.module.scss";
import { SheetDerived } from "../../useSheetDerived";
import { Character } from "../../../../../../models/character.model";

interface props {
    derived: Accessor<SheetDerived>;
    currentCharacter: Accessor<Character | undefined>;
    displayCharacter: Accessor<Character | undefined>;
    allFeatures: Accessor<FeatureDetail[]>;
    chooseStatAt: (featureKey: string, index: number, statKey: string, count: number) => void;
    toggleProficiencyPick: (featureKey: string, skill: string, count: number) => void;
    proficiencyPicks: (featureKey: string) => string[];
    statLabels: Record<string, string>;
}

export const FeaturesCard:Component<props> = (props) => {
    const d = createMemo(() => props.derived());
    const STAT_LABELS = createMemo(() => props.statLabels);

    const FeatureChoices = (featureProps: { feature: FeatureDetail }) => (
        <>
            <For each={choiceStatMads(featureProps.feature)}>
                {(mad) => {
                const count = statChoiceCount(mad);
                const picks = () => statChoicePicks(props.currentCharacter()?.statChoices?.[statChoiceKey(featureProps.feature)], count);
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
                            if (val && val !== pick()) props.chooseStatAt(statChoiceKey(featureProps.feature), i, val, count);
                            })}
                        >
                            <For each={statChoiceOptions(mad).filter((key) => key === pick() || !picks().includes(key))}>
                            {(key) => <Option value={key}>{STAT_LABELS()[key] ?? key}</Option>}
                            </For>
                        </Select>
                        )}
                    </Index>
                    </div>
                );
                }}
            </For>
            <For each={choiceProficiencyMads(featureProps.feature)}>
                {(mad) => {
                const count = proficiencyChoiceCount(mad);
                const key = () => statChoiceKey(featureProps.feature);
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
            <For each={choiceExpertiseMads(featureProps.feature)}>
                {(mad) => {
                const count = expertiseChoiceCount(mad);
                const key = () => expertiseChoiceKey(featureProps.feature);
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
    );

    return <SectionCard icon={Badge} title="Features & Traits">
        <div class={styles.featureList}>
        {/* Index (position-keyed) so a use-spend on any feature doesn't destroy and rebuild the
            whole (tall) feature list — that teardown was what pushed the page down. */}
        <Index each={props.allFeatures()}>
            {(feature) => {
            const usage = createMemo(() => featureUsage(feature(), d().level));
            return (
                <FlatCard
                transparent
                headerName={
                    <div class={styles.featureHeaderRow}>
                    <span class={styles.featureName}>{feature().name}</span>
                    <Show when={feature().metadata?.category || usage()}>
                        <span class={styles.featureCat}>
                        {feature().metadata?.category ?? ""}
                        {usage() ? `${feature().metadata?.category ? " · " : ""}${usage()!.max} / ${usage()!.recharge}` : ""}
                        </span>
                    </Show>
                    </div>
                }
                >
                <div class={styles.featureBody}>
                    <p>{feature().description}</p>
                    <FeatureChoices feature={feature()} />
                </div>
                </FlatCard>
            );
            }}
        </Index>
        </div>
    </SectionCard>
}
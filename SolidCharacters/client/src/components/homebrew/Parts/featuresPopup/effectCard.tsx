import { Component, For, Match, Show, Switch, createMemo, runWithOwner } from "solid-js";
import { Button, Icon, Option, Select } from "coles-solid-library";
import { Delete } from "coles-solid-library/icons";
import { MadType } from "../../../../shared/customHooks/mads/madModels";
import { MadForm } from "../../../../models/data/formModels";
import { commandChipLabel } from "../../../../shared/ai/commands/madCommandCatalog";
import { SegmentedToggle } from "./segmentedToggle";
import { FeaturePrerequisites } from "./parts/featurePrerequisites/featurePrerequisites";
import { SpellFeature } from "./parts/spellFeature/spellFeature";
import { ItemFeature } from "./parts/itemFeature/ItemFeature";
import { CurrencyFeature } from "./parts/currencyFeature/currencyFeature";
import { ACFeature } from "./parts/acFeature/acFeature";
import { ProficienciesFeature } from "./parts/proficienciesFeature/proficienciesFeature";
import { ExistingFeature } from "./parts/existingFeature/existingFeature";
import { LanguagesFeature } from "./parts/languagesFeature/languagesFeature";
import { ResistanceFeature } from "./parts/resistanceFeature/resistanceFeature";
import { SavingThrow } from "./parts/savingThrow/savingThrow";
import { StatFeature } from "./parts/statFeature/StatFeature";
import { SpeedFeature } from "./parts/speedFeature/speedFeature";
import { MovementFeature } from "./parts/movementFeature/movementFeature";
import { SensesFeature } from "./parts/sensesFeature/sensesFeature";
import { HitPointsFeature } from "./parts/hitPointsFeature/hitPointsFeature";
import { AllProfsFeature } from "./parts/allProfsFeature/allProfsFeature";
import { FeatFeature } from "./parts/featFeature/featFeature";
import { ClassFeature } from "./parts/classFeature/classFeature";
import { AdvantageFeature } from "./parts/advantageFeature/advantageFeature";
import { RollBonusFeature } from "./parts/rollBonusFeature/rollBonusFeature";
import { ActionsFeature } from "./parts/actionsFeature/actionsFeature";
import { AttacksFeature } from "./parts/attacksFeature/attacksFeature";
import { UsesFeature } from "./parts/usesFeature/usesFeature";
import { ArmorProfFeature } from "./parts/armorProfFeature/armorProfFeature";
import { WeaponProfFeature } from "./parts/weaponProfFeature/weaponProfFeature";
import { ToolProfFeature } from "./parts/toolProfFeature/toolProfFeature";
import { EffectCardData, MAD_CATEGORIES, MadsApi, PrereqFormArray, PrereqState, branchLabel, branchNumbers } from "./featuresPopup.shared";
import styles from "./featuresPopup.module.scss";

interface EffectCardProps {
    row: MadForm;
    index: number;
    api: MadsApi;
    data: EffectCardData;
    prereqForm: PrereqFormArray;
    prereqs: PrereqState;
    onDelete: () => void;
}

/**
 * One mad row. The row prop is a snapshot — any field write re-runs the parent
 * <For> and recreates this card, so per-card UI state (the value editor's
 * open/closed flag) lives in the popup, keyed by the row's stable name.
 */
export const EffectCard: Component<EffectCardProps> = (props) => {
    const command = createMemo(() =>
        props.row.commandType && props.row.commandCategory
            ? `${props.row.commandType}${props.row.commandCategory}`
            : "");
    const getValue = () => props.row.value;
    const hasValue = createMemo(() => Object.values(props.row.value ?? {}).some(v => v !== ""));
    const editorOpen = () => props.api.isEditorOpen(props.row.name);

    // Editor commits: write the value, stamp the command string, fold the editor away.
    // Editors rebuild the value object from scratch — carry the branch label through so
    // re-editing an effect doesn't silently unlabel its branch.
    const commitValue = (value: Record<string, string>) => {
        const groupLabel = (props.row.value?.["groupLabel"] ?? "").trim();
        props.api.setMadFeature("value", props.index, groupLabel ? { groupLabel, ...value } : value);
        props.api.setMadFeature("command", props.index, command());
        props.api.setEditorOpen(props.row.name, false);
    };

    const setCommandType = (type: string) => {
        props.api.setMadFeature("commandType", props.index, type);
        if (props.row.commandCategory) {
            props.api.setMadFeature("command", props.index, `${type}${props.row.commandCategory}`);
        }
    };

    /** Lowest unused branch number, for the "+ New branch" option. */
    const nextBranch = createMemo(() => {
        const used = branchNumbers(props.api.rows());
        return used.length ? Math.max(...used) + 1 : 1;
    });

    // runWithOwner(null) + equality guard: coles Select fires onChange from a tracked
    // effect (echo) — see setCategory below.
    const setBranch = (raw: string) => runWithOwner(null, () => {
        const next = Number(raw) || 0;
        if (next === (Number(props.row.group) || 0)) return;
        props.api.setMadFeature("group", props.index, next);
    });

    const setCategory = (category: string) => runWithOwner(null, () => {
        if (category === props.row.commandCategory) return;
        const type = props.row.commandType || "Add";
        props.api.setMadFeature("commandCategory", props.index, category);
        props.api.setMadFeature("commandType", props.index, type);
        props.api.setMadFeature("value", props.index, {});
        props.api.setMadFeature("command", props.index, `${type}${category}`);
        props.api.setEditorOpen(props.row.name, true);
    });

    return (
        <div class={styles.effectCard}>
            <div class={styles.effectCardHead}>
                <SegmentedToggle
                    ariaLabel="Add or remove"
                    options={[{ label: "Add", value: "Add" }, { label: "Remove", value: "Remove" }]}
                    value={props.row.commandType}
                    onChange={setCommandType}
                />
                <Select value={props.row.commandCategory} onChange={setCategory} aria-label="Effect category">
                    <For each={MAD_CATEGORIES}>
                        {(category) => <Option value={category}>{category}</Option>}
                    </For>
                </Select>
                <Button class={styles.deleteBtn} aria-label="Delete effect" onClick={() => props.onDelete()}>
                    <Icon icon={Delete} />
                </Button>
            </div>

            <div class={styles.typeRow}>
                <SegmentedToggle
                    ariaLabel="Effect target"
                    options={[
                        { label: "Character", value: MadType.Character },
                        { label: "Info", value: MadType.Info },
                    ]}
                    value={props.row.type}
                    onChange={(type) => props.api.setMadFeature("type", props.index, type)}
                />
                <span class={styles.typeCaption}>
                    {props.row.type === MadType.Info
                        ? "Extra feature information — not a direct character sheet change"
                        : "Applies changes to the character sheet"}
                </span>
            </div>

            <Show when={command()}>
                <div class={styles.valueRow}>
                    <Show when={hasValue()}>
                        <span class={styles.valueSummary}>
                            {commandChipLabel({ command: command(), value: props.row.value })}
                        </span>
                    </Show>
                    <Button
                        class={styles.addValueBtn}
                        onClick={() => props.api.setEditorOpen(props.row.name, !editorOpen())}
                    >
                        {editorOpen() ? "− Hide value" : hasValue() ? "Edit value" : "+ Add value"}
                    </Button>
                </div>

                <Show when={editorOpen()}>
                    <Switch>
                        <Match when={command() === "AddSpells" || command() === "RemoveSpells"}>
                            <SpellFeature
                                allSpells={props.data.allSpells}
                                getValue={getValue}
                                allowChoice={command() === "AddSpells"}
                                commit={commitValue}
                            />
                        </Match>
                        <Match when={command() === "AddItems" || command() === "RemoveItems"}>
                            <ItemFeature
                                allItems={props.data.allItems}
                                getValue={getValue}
                                allowChoice={command() === "AddItems"}
                                commit={commitValue}
                            />
                        </Match>
                        <Match when={command() === "AddCurrency" || command() === "RemoveCurrency"}>
                            <CurrencyFeature getValue={getValue} setCurrecy={(type, amount) => {
                                const old = getValue();
                                let amt = +(old?.["amount"] ?? "0");
                                if (old?.["type"] === type) {
                                    commitValue({ "type": type, "amount": (amt += amount).toString() });
                                } else {
                                    commitValue({ "type": type, "amount": amount.toString() });
                                }
                            }} />
                        </Match>
                        <Match when={command() === "AddArmorClass" || command() === "RemoveArmorClass"}>
                            <ACFeature getValue={getValue} toggleAC={(bonus, stats, condition) => {
                                const next: Record<string, string> = { "bonus": bonus.toString() };
                                if (stats.length) next["stats"] = stats.join(",");
                                if (condition) next["condition"] = condition;
                                commitValue(next);
                            }} />
                        </Match>
                        <Match when={command() === "AddProficiencies" || command() === "RemoveProficiencies" || command() === "AddExpertise" || command() === "RemoveExpertise"}>
                            <ProficienciesFeature
                                getValue={getValue}
                                allowChoice={command() === "AddProficiencies"}
                                toggleProf={(prof, extra) => {
                                    const next: Record<string, string> = { "proficiency": prof };
                                    if (prof === "choice" && extra?.options) {
                                        next["options"] = extra.options;
                                        next["count"] = extra.count ?? "1";
                                    }
                                    commitValue(next);
                                }} />
                        </Match>
                        <Match when={command() === "AddFeatures" || command() === "RemoveFeatures"}>
                            <ExistingFeature
                                getValue={getValue}
                                allFeatures={props.data.allFeatures}
                                toggleFeature={(featureID) => {
                                    commitValue(getValue()?.["ID"] === featureID ? { "ID": "" } : { "ID": featureID });
                                }}
                            />
                        </Match>
                        <Match when={command() === "AddLanguages" || command() === "RemoveLanguages"}>
                            <LanguagesFeature
                                getValue={getValue}
                                toggleValue={(language) => {
                                    commitValue(getValue()?.["name"] === language ? { "name": "" } : { "name": language });
                                }}
                            />
                        </Match>
                        <Match when={command() === "AddResistances" || command() === "RemoveResistances" || command() === "AddVulnerabilities" || command() === "RemoveVulnerabilities" || command() === "AddImmunities" || command() === "RemoveImmunities"}>
                            <ResistanceFeature
                                getValue={getValue}
                                getCommandCategory={createMemo(() => props.row.commandCategory)}
                                toggleValue={(dmgType) => {
                                    commitValue(getValue()?.["damageType"] === dmgType ? { "damageType": "" } : { "damageType": dmgType });
                                }}
                            />
                        </Match>
                        <Match when={command() === "AddSavingThrows" || command() === "RemoveSavingThrows"}>
                            <SavingThrow
                                getValue={getValue}
                                toggleValue={(stat) => {
                                    commitValue(getValue()?.["stat"] === stat ? { "stat": "" } : { "stat": stat });
                                }}
                            />
                        </Match>
                        <Match when={command() === "AddStats" || command() === "RemoveStats"}>
                            <StatFeature
                                getValue={getValue}
                                toggleValue={(stat, value, extra) => {
                                    const next: Record<string, string> = { "stat": stat, "statValue": value.toString() };
                                    if (extra?.options) next["options"] = extra.options;
                                    if (extra?.mode) next["mode"] = extra.mode;
                                    if (stat === "choice" && extra?.count) next["count"] = extra.count;
                                    commitValue(next);
                                }}
                            />
                        </Match>
                        <Match when={command() === "AddSpeed" || command() === "RemoveSpeed"}>
                            <SpeedFeature
                                getValue={getValue}
                                toggleValue={(speed, mode) => {
                                    const next: Record<string, string> = { "speed": speed.toString() };
                                    if (mode === "set") next["mode"] = "set";
                                    commitValue(next);
                                }}
                            />
                        </Match>
                        <Match when={command() === "AddAllProficiencies" || command() === "RemoveAllProficiencies"}>
                            <AllProfsFeature
                                getValue={getValue}
                                toggleValue={(value, pbChoice) => {
                                    if (getValue()?.["allProficiencies"] === value) {
                                        commitValue({ "allProficiencies": "", "proficiencyBonusChoice": "" });
                                    } else {
                                        commitValue({ "allProficiencies": value, "proficiencyBonusChoice": pbChoice });
                                    }
                                }}
                            />
                        </Match>
                        <Match when={command() === "AddFeats" || command() === "RemoveFeats"}>
                            <FeatFeature
                                getValue={getValue}
                                allFeats={props.data.allFeats}
                                toggleValue={(value) => {
                                    commitValue(getValue()?.["ID"] === value ? { "featID": "" } : { "featID": value });
                                }}
                            />
                        </Match>
                        <Match when={command() === "AddClassFeature" || command() === "RemoveClassFeature"}>
                            <ClassFeature
                                getValue={getValue}
                                toggleValue={(name, description, category) => {
                                    commitValue({ "name": name, "description": description, "category": category });
                                }}
                            />
                        </Match>
                        <Match when={command() === "AddAdvantage" || command() === "RemoveAdvantage"}>
                            <AdvantageFeature
                                getValue={getValue}
                                toggleValue={(rollType, mode, stat, condition) => {
                                    commitValue({ "rollType": rollType, "mode": mode, "stat": stat, "condition": condition });
                                }}
                            />
                        </Match>
                        <Match when={command() === "AddRollBonus" || command() === "RemoveRollBonus"}>
                            <RollBonusFeature
                                getValue={getValue}
                                toggleValue={(rollType, bonus, proficiencyBonus, statBonus, stat, condition) => {
                                    const next: Record<string, string> = { "rollType": rollType };
                                    if (bonus) next["bonus"] = bonus;
                                    if (proficiencyBonus) next["proficiencyBonus"] = proficiencyBonus;
                                    if (statBonus) next["statBonus"] = statBonus;
                                    if (stat) next["stat"] = stat;
                                    if (condition) next["condition"] = condition;
                                    commitValue(next);
                                }}
                            />
                        </Match>
                        <Match when={command() === "AddActions" || command() === "RemoveActions"}>
                            <ActionsFeature
                                getValue={getValue}
                                toggleValue={(name, actionType, description, amount, proficiencyBonus, recharge) => {
                                    const next: Record<string, string> = { "name": name, "actionType": actionType };
                                    if (description) next["description"] = description;
                                    if (amount) next["amount"] = amount;
                                    if (proficiencyBonus) next["proficiencyBonus"] = proficiencyBonus;
                                    // recharge only means something alongside a uses spec
                                    if ((amount || proficiencyBonus) && recharge) next["recharge"] = recharge;
                                    commitValue(next);
                                }}
                            />
                        </Match>
                        <Match when={command() === "AddAttacks" || command() === "RemoveAttacks"}>
                            <AttacksFeature
                                getValue={getValue}
                                toggleValue={(amount) => {
                                    commitValue({ "amount": amount.toString() });
                                }}
                            />
                        </Match>
                        <Match when={command() === "AddUses" || command() === "RemoveUses"}>
                            <UsesFeature
                                getValue={getValue}
                                toggleValue={(amount, proficiencyBonus, recharge) => {
                                    const next: Record<string, string> = { "recharge": recharge };
                                    if (amount) next["amount"] = amount;
                                    if (proficiencyBonus) next["proficiencyBonus"] = proficiencyBonus;
                                    props.api.setMadFeature("value", props.index, next);
                                    props.api.setMadFeature("command", props.index, command());
                                    // Uses describes its owning feature (uses/recharge), not a sheet change.
                                    props.api.setMadFeature("type", props.index, MadType.Info);
                                    props.api.setEditorOpen(props.row.name, false);
                                }}
                            />
                        </Match>
                        <Match when={command() === "AddArmorProficiencies" || command() === "RemoveArmorProficiencies"}>
                            <ArmorProfFeature
                                getValue={getValue}
                                allowChoice={command() === "AddArmorProficiencies"}
                                toggleProf={(armor, extra) => {
                                    const next: Record<string, string> = { "armor": armor };
                                    if (armor === "choice" && extra?.options) {
                                        next["options"] = extra.options;
                                        next["count"] = extra.count ?? "1";
                                    }
                                    commitValue(next);
                                }} />
                        </Match>
                        <Match when={command() === "AddWeaponProficiencies" || command() === "RemoveWeaponProficiencies"}>
                            <WeaponProfFeature
                                allItems={props.data.allItems}
                                getValue={getValue}
                                allowChoice={command() === "AddWeaponProficiencies"}
                                toggleProf={(weapon, extra) => {
                                    const next: Record<string, string> = { "weapon": weapon };
                                    if (weapon === "choice" && extra?.options) {
                                        next["options"] = extra.options;
                                        next["count"] = extra.count ?? "1";
                                    }
                                    commitValue(next);
                                }} />
                        </Match>
                        <Match when={command() === "AddToolProficiencies" || command() === "RemoveToolProficiencies"}>
                            <ToolProfFeature
                                allItems={props.data.allItems}
                                getValue={getValue}
                                allowChoice={command() === "AddToolProficiencies"}
                                toggleProf={(tool, extra) => {
                                    const next: Record<string, string> = { "tool": tool };
                                    if (tool === "choice" && extra?.options) {
                                        next["options"] = extra.options;
                                        next["count"] = extra.count ?? "1";
                                    }
                                    commitValue(next);
                                }} />
                        </Match>
                        <Match when={command() === "AddMovement" || command() === "RemoveMovement"}>
                            <MovementFeature
                                getValue={getValue}
                                toggleValue={(movementType, speed) => {
                                    const next: Record<string, string> = { "movementType": movementType };
                                    if (speed !== undefined) next["speed"] = speed.toString();
                                    commitValue(next);
                                }}
                            />
                        </Match>
                        <Match when={command() === "AddSenses" || command() === "RemoveSenses"}>
                            <SensesFeature
                                getValue={getValue}
                                toggleValue={(sense, range) => {
                                    commitValue({ "sense": sense, "range": range.toString() });
                                }}
                            />
                        </Match>
                        <Match when={command() === "AddHitPoints" || command() === "RemoveHitPoints"}>
                            <HitPointsFeature
                                getValue={getValue}
                                toggleValue={(amount, perLevel) => {
                                    const next: Record<string, string> = { "amount": amount.toString() };
                                    if (perLevel) next["perLevel"] = "true";
                                    commitValue(next);
                                }}
                            />
                        </Match>
                    </Switch>
                </Show>
            </Show>

            <div class={styles.prereqSection}>
                <FeaturePrerequisites prereqForm={props.prereqForm} prereqs={props.prereqs} Submit={() => { /* prereq→mad wiring pending (pre-existing) */ }} />
            </div>

            <div class={styles.choiceGroupRow}>
                <label class={styles.label}>Applies</label>
                <Select value={String(props.row.group ?? 0)} onChange={setBranch} aria-label="Effect branch">
                    <Option value="0">Always</Option>
                    <For each={branchNumbers(props.api.rows())}>
                        {(group) => {
                            const label = branchLabel(props.api.rows(), group);
                            return <Option value={String(group)}>{label ? `Branch ${group} — ${label}` : `Branch ${group}`}</Option>;
                        }}
                    </For>
                    <Option value={String(nextBranch())}>+ New branch</Option>
                </Select>
                <span class={styles.choiceCaption}>
                    Branches are exclusive — the player picks ONE · "Always" effects apply regardless
                </span>
            </div>
        </div>
    );
};

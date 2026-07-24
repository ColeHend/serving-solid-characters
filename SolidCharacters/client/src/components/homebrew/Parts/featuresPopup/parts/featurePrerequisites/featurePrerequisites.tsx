import { Component, createMemo, For, Match, Show, Switch } from "solid-js";
import { EXAMPLE_CHARACTER } from "../../../../../../shared/customHooks/dndInfo/useExampleChars";
import { Button, FormArray, FormField, FormGroup, Icon, Input, Option, Select, Container } from "coles-solid-library";
import { Delete } from "coles-solid-library/icons";
import style from "./featurePrerequisites.module.scss";
import { MadPrereqForm } from "../../../../../../models/data/formModels";
import { newPrereqFormGroup } from "../../featuresPopup.shared";

interface props {
    /** The owning effect row's OWN prerequisites — one standalone FormArray per row. */
    prereqForm: FormArray<MadPrereqForm>;
}

export const FeaturePrerequisites: Component<props> = (props) => {

    const formGroup = props.prereqForm;

    const currentFormLength = createMemo(() => formGroup.get().length);

    const addNewPrerequisites = () => {
        formGroup.add(newPrereqFormGroup({ formName: `prereq ${currentFormLength() + 1}` }));
    }

    const setField = <T extends keyof MadPrereqForm>(form: FormGroup<MadPrereqForm>, key: T, value: MadPrereqForm[T] | undefined) => {
        if (value === undefined) return;
        form.set(key, value);
    };

    // Stable FormGroup refs, NOT .get() clones: <For> keys rows by reference, so a
    // delete unmounts exactly the clicked row. The library Select keeps its display
    // state in the FormField provider (props.value only seeds at mount) — position-
    // keyed rows would leave the deleted row's traits showing on the survivor.
    const prerequisites = createMemo(() => formGroup.getGroups());

    const keys = [
        "Name",
        "Level",
        "Spells",
        "Race",
        "AC",
        "Speed",
        "Class",
        "Subclass",
        "Background",
        "Features",
        "Proficiencies",
        "Saving throws",
        "Resistances",
        "Vulnerabilities",
        "Immunities",
        "Languages",
        "Max HP",
        "Current HP",
        "Temporary HP",
        "Strength",
        "Dexterity",
        "Constitution",
        "Intelligence",
        "Wisdom",
        "Charisma",
        "Item → Inventory",
        "Item → Equipped",
        "Item → Attuned",
        "Item → Currency → Platinum Pieces",
        "Item → Currency → Gold Pieces",
        "Item → Currency → Electrum Pieces",
        "Item → Currency → Sliver Pieces",
        "Item → Currency → Copper Pieces"
    ]

    const numberOperations = [
        "===",
        "!==",
        ">",
        "<",
        ">=",
        "<=",
    ];

    const stringOperations = [
        "===",
        "!==",
        "includes",
        "excludes",
    ]

    const getPrettyOpName = (operation: string) => {
        switch (operation) {
            case "===":
                return "= Equal To";

            case "!==":
                return "≠ Not Equal To";

            case ">":
                return "> Greater Than";

            case "<":
                return "< Less Than"

            case ">=":
                return "≥ At Least"

            case "<=":
                return "≦ At Most";

            case "includes":
                return "Includes";

            case "excludes":
                return "Excludes";

            case "startsWith":
                return "Starts With";

            case "endsWith":
                return "Ends With";

            default:
                return operation;
        }
    }

    const getCharacterKeyType = (formKey: string) => {
        switch (formKey) {
            case "Name":
                return typeof EXAMPLE_CHARACTER.name;

            case "Level":
                return typeof EXAMPLE_CHARACTER.level;

            case "Spells":
                return typeof EXAMPLE_CHARACTER.spells[0].name;

            case "Race":
                return typeof EXAMPLE_CHARACTER.race.species;

            case "AC":
                return typeof EXAMPLE_CHARACTER.ArmorClass;

            case "Speed":
                return typeof EXAMPLE_CHARACTER.Speed;

            case "Class":
                return typeof EXAMPLE_CHARACTER.className;

            case "Subclass":
                return typeof EXAMPLE_CHARACTER.subclass;

            case "Background":
                return typeof EXAMPLE_CHARACTER.background;

            case "Features":
                return typeof EXAMPLE_CHARACTER.features[0].id;

            case "Proficiencies":
                return "string";

            case "Saving throws":
                return typeof EXAMPLE_CHARACTER.savingThrows[0].stat;

            case "Resistances":
                return typeof EXAMPLE_CHARACTER.resistances[0].type;

            case "Vulnerabilities":
                return typeof EXAMPLE_CHARACTER.vulnerabilities[0].type;

            case "Immunities":
                return typeof EXAMPLE_CHARACTER.immunities[0].type;

            case "Languages":
                return typeof EXAMPLE_CHARACTER.languages[0];

            case "Max HP":
                return typeof EXAMPLE_CHARACTER.health.max;

            case "Current HP":
                return typeof EXAMPLE_CHARACTER.health.current;

            case "Temporary HP":
                return typeof EXAMPLE_CHARACTER.health.temp;

            case "Strength":
                return typeof EXAMPLE_CHARACTER.stats.str;

            case "Dexterity":
                return typeof EXAMPLE_CHARACTER.stats.dex;

            case "Constitution":
                return typeof EXAMPLE_CHARACTER.stats.con;

            case "Intelligence":
                return typeof EXAMPLE_CHARACTER.stats.int;

            case "Wisdom":
                return typeof EXAMPLE_CHARACTER.stats.wis;

            case "Charisma":
                return typeof EXAMPLE_CHARACTER.stats.cha;

            // Gear entries are {name, id?} refs now, but prerequisite values still compare
            // against item NAMES — the editor input stays a plain string.
            case "Item → Inventory":
            case "Item → Equipped":
            case "Item → Attuned":
                return "string";

            case "Item → Currency → Platinum Pieces":
                return typeof EXAMPLE_CHARACTER.items.currency.platinumPieces;

            case "Item → Currency → Gold Pieces":
                return typeof EXAMPLE_CHARACTER.items.currency.goldPieces;

            case "Item → Currency → Electrum Pieces":
                return typeof EXAMPLE_CHARACTER.items.currency.electrumPieces;

            case "Item → Currency → Sliver Pieces":
                return typeof EXAMPLE_CHARACTER.items.currency.sliverPieces;

            case "Item → Currency → Copper Pieces":
                return typeof EXAMPLE_CHARACTER.items.currency.copperPieces;

            default:
                return "undefined";
        }
    }

    return <div class={style.leftAlignText}>

        <div class={style.header}>
            <h2>Prerequisites</h2>

            <Button onClick={addNewPrerequisites}>+ Add Rule</Button>
        </div>

        <div class={style.prerequisites}>
            <For each={prerequisites()}>
                {(form, i) => {
                    const trait = () => form.get()["value"] ?? "";
                    const rowType = () => getCharacterKeyType(trait());
                    return <Container theme="container" class={style.prereqBox}>
                        <div class={style.prereqItem}>
                            <span class={style.prefix}><i>Character has</i></span>

                            <FormField name="Trait" class={style.keyField}>
                                <Select transparent value={trait()} onChange={(value) => setField(form, "value", value)}>
                                    <For each={keys}>
                                        {key => <Option value={key}>{key}</Option>}
                                    </For>
                                </Select>
                            </FormField>

                            <Show when={["string", "number", "bigint"].includes(rowType())}>
                                <FormField name="Operation" class={style.operationField}>
                                    <Switch>
                                        <Match when={rowType() === "string"}>
                                            <Select transparent defaultValue="===" value={form.get()["operation"] ?? ""} onChange={(value) => setField(form, "operation", value)}>
                                                <For each={stringOperations}>
                                                    {operation => <Option value={operation}>{getPrettyOpName(operation)}</Option>}
                                                </For>
                                            </Select>
                                        </Match>
                                        <Match when={rowType() === "number" || rowType() === "bigint"}>
                                            <Select transparent value={form.get()["operation"] ?? ""} onChange={(value) => setField(form, "operation", value)}>
                                                <For each={numberOperations}>
                                                    {operation => <Option value={operation}>{getPrettyOpName(operation)}</Option>}
                                                </For>
                                            </Select>
                                        </Match>
                                    </Switch>
                                </FormField>

                                <FormField name="Value" class={style.valueField}>
                                    <Switch>
                                        <Match when={rowType() === "string"}>
                                            <Input transparent type="text" value={form.get()["keyValue"] ?? ""} onInput={(e) => setField(form, "keyValue", e.currentTarget.value)} />
                                        </Match>
                                        <Match when={rowType() === "number" || rowType() === "bigint"}>
                                            {/* number inputs never fire onInput in the library — onChange only */}
                                            <Input transparent type="number" value={form.get()["keyValue"] ?? ""} onChange={(e) => setField(form, "keyValue", e.currentTarget.value)} />
                                        </Match>
                                    </Switch>
                                </FormField>
                            </Show>

                            <FormField name="Group" class={style.groupField}>
                                <Input transparent type="number" value={form.get()["group"] ?? 0} onChange={(e) => setField(form, "group", +e.currentTarget.value)}/>
                            </FormField>

                            <Button transparent class={style.deleteButton} aria-label="Remove rule" onClick={() => props.prereqForm.remove(i())}>
                                <Icon icon={Delete} size="small" color="red" />
                            </Button>
                        </div>
                    </Container>;
                }}
            </For>

        </div>

    </div>
}

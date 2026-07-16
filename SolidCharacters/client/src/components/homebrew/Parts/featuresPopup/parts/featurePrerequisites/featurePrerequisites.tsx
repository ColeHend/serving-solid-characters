import { Accessor, Component, createMemo, For, Match, Setter, Show, Switch } from "solid-js";
import { EXAMPLE_CHARACTER } from "../../../../../../shared/customHooks/dndInfo/useExampleChars";
import { Button, FormArray, FormField, FormGroup, Icon, Input, Option, Select, Container } from "coles-solid-library";
import { Delete } from "coles-solid-library/icons";
import style from "./featurePrerequisites.module.scss";
import { MadPrerequisite } from "../../../../../../shared";
import { MadPrereqForm } from "../../../../../../models/data/formModels";

interface props {
    Submit: (key: string) => void;
    prereqs: [Accessor<Record<string, MadPrerequisite>>, Setter<Record<string, MadPrerequisite>>];
    prereqForm: FormArray<MadPrereqForm>;
}

export const FeaturePrerequisites: Component<props> = (props) => {

    const formGroup = props.prereqForm;

    const currentFormLength = createMemo(() => formGroup.get().length);

    const addNewPrerequisites = () => {
        const newForm = new FormGroup<MadPrereqForm>({
            formName: [`prereq ${currentFormLength() + 1}`, []],
            keyValue: ["", []],
            operation: ["", []],
            value: ['', []],
            group: [0, []],
        })

        formGroup.add(newForm);
    }

    const setPrereq = <T  extends keyof MadPrereqForm>(key: T, index: number, value: MadPrereqForm[T]) => {
        const form = formGroup.getGroup(index);


        if (!form || value === undefined) {
            return;
        }


        form.set(key, value);
    }

    const getPrereq = <T extends keyof MadPrereqForm>(key: T, index: number) => {
        const form = formGroup.getGroup(index);

        if (!form) {
            return null;
        }

        const toReturn = form.get()[key];

        return toReturn;
    }

    const selectedType = (index: number) =>
        getCharacterKeyType(getPrereq("value", index) ?? "");

    const prerequisites = createMemo(() => formGroup.get());

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

            case "Item → Inventory":
                return typeof EXAMPLE_CHARACTER.items.inventory[0];

            case "Item → Equipped":
                return typeof EXAMPLE_CHARACTER.items.equipped[0];

            case "Item → Attuned":
                return typeof EXAMPLE_CHARACTER.items.attuned[0];

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
                {(form, i) => <Container theme="container" class={style.prereqBox}>
                    <div class={style.prereqItem}>
                        <span class={style.prefix}><i>Character has</i></span>

                        <FormField name="Trait" class={style.keyField}>
                            <Select transparent value={getPrereq("value", i()) ?? ""} onChange={(value) => setPrereq("value", i(), value)}>
                                <For each={keys}>
                                    {key => <Option value={key}>{key}</Option>}
                                </For>
                            </Select>
                        </FormField>

                        <Show when={["string", "number", "bigint"].includes(selectedType(i()))}>
                            <FormField name="Operation" class={style.operationField}>
                                <Switch>
                                    <Match when={selectedType(i()) === "string"}>
                                        <Select transparent defaultValue="===" value={getPrereq("operation", i()) ?? ""} onChange={(value) => setPrereq("operation", i(), value)}>
                                            <For each={stringOperations}>
                                                {operation => <Option value={operation}>{getPrettyOpName(operation)}</Option>}
                                            </For>
                                        </Select>
                                    </Match>
                                    <Match when={selectedType(i()) === "number" || selectedType(i()) === "bigint"}>
                                        <Select transparent value={getPrereq("operation", i()) ?? ""} onChange={(value) => setPrereq("operation", i(), value)}>
                                            <For each={numberOperations}>
                                                {operation => <Option value={operation}>{getPrettyOpName(operation)}</Option>}
                                            </For>
                                        </Select>
                                    </Match>
                                </Switch>
                            </FormField>

                            <FormField name="Value" class={style.valueField}>
                                <Switch>
                                    <Match when={selectedType(i()) === "string"}>
                                        <Input transparent type="text" value={getPrereq("keyValue", i()) ?? ""} onInput={(e) => setPrereq("keyValue", i(), e.currentTarget.value)} />
                                    </Match>
                                    <Match when={selectedType(i()) === "number" || selectedType(i()) === "bigint"}>
                                        <Input transparent type="number" value={getPrereq("keyValue", i()) ?? ""} onInput={(e) => setPrereq("keyValue", i(), e.currentTarget.value)} />
                                    </Match>
                                </Switch>
                            </FormField>
                        </Show>

                        <FormField name="Group" class={style.groupField}>
                            <Input transparent type="number" value={getPrereq("group", i()) ?? 0} onInput={(e) => setPrereq("group", i(), +e.currentTarget.value)}/>
                        </FormField>

                        <Button transparent class={style.deleteButton} aria-label="Remove rule" onClick={() => props.prereqForm.remove(i())}>
                            <Icon icon={Delete} size="small" color="red" />
                        </Button>
                    </div>
                </Container>}
            </For>

        </div>

    </div>
}

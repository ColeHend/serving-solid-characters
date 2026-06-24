import { Accessor, Component, createEffect, createMemo, createSignal, For, Match, Setter, Show, Switch } from "solid-js";
import { EXAMPLE_CHARACTER } from "../../../../../../shared/customHooks/dndInfo/useExampleChars";
import { Character, CharacterRace } from "../../../../../../models/character.model";
import { addSnackbar, Button, Form, FormArray, FormField, FormGroup, Input, Option, Select, Container } from "coles-solid-library";
import style from "./featurePrerequisites.module.scss";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";
import { MadPrerequisite } from "../../../../../../shared";
import { MadPrereqForm } from "../../../../../../models/data/formModels";

interface props {
    Submit: (key: string) => void;
    prereqs: [Accessor<Record<string, MadPrerequisite>>, Setter<Record<string, MadPrerequisite>>];
    prereqForm: FormArray<MadPrereqForm>;
}

export const FeaturePrerequisites: Component<props> = (props) => {
    
    // const [prerequisites, setPrerequisites] = props.prereqs;
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

    // prop character for keys

    const characterKeys = createMemo(() => Object.keys(EXAMPLE_CHARACTER));
    
    const charRaceKeys = createMemo(() => Object.keys(EXAMPLE_CHARACTER.race));
    const charProficienciesKeys = createMemo(() => Object.keys(EXAMPLE_CHARACTER.proficiencies.skills));
    const charHealthKeys = createMemo(() => Object.keys(EXAMPLE_CHARACTER.health));
    const charStatKeys = createMemo(() => Object.keys(EXAMPLE_CHARACTER.stats));
    const charItemKeys = createMemo(() => Object.keys(EXAMPLE_CHARACTER.items));
    const charCurrencyKeys = createMemo(() => Object.keys(EXAMPLE_CHARACTER.items.currency));

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

    // const getKeyType = (key: string) => {
    //     const value = Gandalf[key as keyof Character];
     
    //     switch (typeof value) {
    //         case "string":
    //             return "string";
            
    //         case "number":
    //             return "number"

    //         case "object":
                
    //             if (Array.isArray(value)) {
    //                 return "array"
    //             } else if (value === null) {
    //                 return "null"
    //             } else {
    //                 return "object"
    //             }

    //         default:
    //             return "undefined";
    //     }
    // };

    // const getRaceKeyType = (key: string) => {
    //     const value = Gandalf.race[key as keyof Character['race']];
     
    //     switch (typeof value) {
    //         case "string":
    //             return "string";
            
    //         case "number":
    //             return "number"

    //         case "object":
                
    //             if (Array.isArray(value)) {
    //                 return "array"
    //             } else if (value === null) {
    //                 return "null"
    //             } else {
    //                 return "object"
    //             }

    //         default:
    //             return "undefined";
    //     }
    // };

    // const getProficenciesKeyType = (key: string) => {
    //     const value = Gandalf.proficiencies[key as keyof Character['proficiencies']];
     
    //     switch (typeof value) {
    //         case "string":
    //             return "string";
            
    //         case "number":
    //             return "number"

    //         case "object":
                
    //             if (Array.isArray(value)) {
    //                 return "array"
    //             } else if (value === null) {
    //                 return "null"
    //             } else {
    //                 return "object"
    //             }

    //         default:
    //             return "undefined";
    //     }
    // }

    // const resetForm = () => {
    //     setPrereqKey("");
    //     setPrereqGroup(0);
    //     setPrereqValue("");
    //     setTertiaryKey("");
    //     setSubPrereqKey("");
    //     setPrereqOperation("");
    // }

    // const fillForm = (key?: string, secondKey?: string, thirdKey?: string, group?: number, value?: string, operation?: string) => {
    //     setPrereqKey(key ?? "");
    //     setPrereqGroup(group ?? 0);
    //     setPrereqValue(value ?? "");
    //     setTertiaryKey(thirdKey ?? "");
    //     setSubPrereqKey(secondKey ?? "");
    //     setPrereqOperation(operation ?? "");
    // }

    // const handleSubmit = (hasSecondary: boolean, hasTertiary: boolean) => {
    //     const value = prereqValue();
    //     const group = prereqGroup();
    //     const operation = prereqOperation();
    //     const FirstKey = prereqKey();
    //     const SecondaryKey = subPrereqKey();
    //     const TertiaryKey = tertiaryKey();
        
    //     const hasSecond = hasSecondary;
    //     const hasThird = hasTertiary;

    //     if (FirstKey === "" || FirstKey === undefined) {
    //         addSnackbar({
    //             message: "Must select a character trait!",
    //             severity: "error",
    //         })

    //         return;
    //     }

        
    //     if (operation === "" || operation === undefined) {
    //         addSnackbar({
    //             message: "Must select an operation!",
    //             severity: "error",
    //         });
            
    //         return;
    //     }
        
    //     if (value === "" || value === undefined) {
    //         addSnackbar({
    //             message: "Must input an value!",
    //             severity: "error",
    //         })

    //         return;
    //     }

    //     if (hasSecond && SecondaryKey === "" || SecondaryKey === undefined) {
    //         addSnackbar({
    //             message: "Must select the secondary key!",
    //             severity: "error"
    //         })

    //         return;
    //     }

    //     if (hasThird && TertiaryKey === "" || TertiaryKey === undefined) {
    //         addSnackbar({
    //             message: "Must select the tertiary key!",
    //             severity: "error"
    //         })

    //         return;
    //     }
        
    //     // setPrerequisitesValue(`prerequisites ${prereqKeys().length + 1}`, {
    //     //     value: value,
    //     //     operation: operation,
    //     //     keyValue: FirstKey,
    //     //     secondaryValue: SecondaryKey ?? "",
    //     //     tertiaryValue: TertiaryKey ?? "",
    //     //     group: group
    //     // });
    //     // props.Submit(`prerequisites ${prereqKeys().length + 1}`);
    //     resetForm();
        
    // }

    // createEffect(() => {
    //     const key = prereqKey();
    //     const secondaryKey = subPrereqKey();
        
    //     // Determine if secondary key is needed
    //     const needsSecondary = ["race", "proficiencies", "health", "stats", "items"].includes(key);
    //     setHasSecondary(needsSecondary);
        
    //     // Determine if tertiary key is needed (only for currency)
    //     const needsTertiary = needsSecondary && key === "items" && secondaryKey === "currency";
    //     setHasTertiary(needsTertiary);
    // }, [prereqKey, subPrereqKey])

    return <div class={`${style.leftAlignText}`}>
        
        <div>
            <h2>Prerequisites</h2>

            <Button onClick={addNewPrerequisites}>+ Add Rule</Button>
        </div>

        <div class={`${style.prerequisites}`}>
            <For each={prerequisites()}>
                {(form, i) => <Container theme="container" class={`${style.prereqBox}`}>
                    <div class={`${style.prereqItem}`}>
                        <div>
                            <span><i>Character has</i></span>
                            
                            <div class={`${style.keyInput}`}>
                                <FormField name="key">
                                    <Select value={getPrereq("value", i()) ?? ""} onChange={(value) => setPrereq("value", i(), value)} class={`${style.inputBorder}`}>
                                        <For each={keys}>
                                            {key => <Option value={key}>{key}</Option>}
                                        </For>
                                    </Select>
                                </FormField>
                            </div>

                            <div class={`${style.operationInput}`}>
                                <FormField name="operation">
                                    <Switch>
                                        <Match when={getCharacterKeyType(getPrereq("value", i()) ?? "") === "string"}>
                                            <Select defaultValue="===" value={getPrereq("operation", i()) ?? ""} onChange={(value) => setPrereq("operation", i(), value)} class={`${style.inputBorder}`}>
                                                <For each={stringOperations}>
                                                    {operation => <Option value={operation}>{getPrettyOpName(operation)}</Option>}
                                                </For>
                                            </Select>
                                        </Match>
                                        <Match when={getCharacterKeyType(getPrereq("value", i()) ?? "") === "number" || getCharacterKeyType(getPrereq("value", i()) ?? "") === "bigint" }>
                                            <Select value={getPrereq("operation", i()) ?? ""} onChange={(value) => setPrereq("operation", i(), value)} class={`${style.inputBorder}`}>
                                                <For each={numberOperations}>
                                                    {operation => <Option value={operation}>{getPrettyOpName(operation)}</Option>}
                                                </For>
                                            </Select>
                                        </Match>
                                    </Switch>
                                </FormField>
                            </div>

                            <div class={`${style.keyValueInput}`}>
                                <Switch>
                                    <Match when={getCharacterKeyType(getPrereq("value", i()) ?? "") === "string"}>
                                        <FormField name={`${getPrereq("value", i())}`}>
                                            <Input placeholder="" type="text" value={getPrereq("keyValue", i()) ?? ""} onInput={(e) => setPrereq("keyValue", i(), e.currentTarget.value)} class={`${style.keyValueInput} ${style.inputBorder}`} />
                                        </FormField>
                                    </Match>
                                    <Match when={getCharacterKeyType(getPrereq("value", i()) ?? "") === "number" || getCharacterKeyType(getPrereq("value", i()) ?? "") === "bigint" }>
                                        <FormField name={`${getPrereq("value", i())}`}>
                                            <Input type="number" value={getPrereq("keyValue", i()) ?? ""} onInput={(e) => setPrereq("keyValue", i(), e.currentTarget.value)} class={`${style.keyValueInput} ${style.inputBorder}`} />
                                        </FormField>
                                    </Match>
                                </Switch>
                            </div>
                        </div>
                        <div class={`${style.bottomHalf}`}>
                            <div class={`${style.groupInput}`}>
                                <FormField name="Group">
                                    <Input type="number" value={getPrereq("group", i()) ?? 0} onInput={(e) => setPrereq("group", i(), +e.currentTarget.value)}/>
                                </FormField>
                            </div>

                            <Button>X</Button>
                        </div>
                    </div>
                </Container>}
            </For>

        </div>

    </div>
}
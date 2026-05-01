import { Accessor, Component, createEffect, createMemo, createSignal, For, Match, Setter, Show, Switch } from "solid-js";
import { Gandalf } from "../../../../../../shared/customHooks/dndInfo/useExampleChars";
import { Character, CharacterRace } from "../../../../../../models/character.model";
import { addSnackbar, Button, Form, FormField, Input, Option, Select } from "coles-solid-library";
import style from "./featurePrerequisites.module.scss";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";
import { MadPrerequisite } from "../../../../../../shared";

interface props {
    Submit: (group: number, operation: string, value: string, key: string, secondaryKey: string, tertiaryKey: string) => boolean;
    prereqs: [Accessor<Record<string, MadPrerequisite>>, Setter<Record<string, MadPrerequisite>>];
}

export const FeaturePrerequisites: Component<props> = (props) => {
    
    const [prerequisites, setPrerequisites] = props.prereqs;

    const prereqKeys = createMemo(() => Object.keys(prerequisites()));

    const getPrerequisites = (name: string) => {
        return prerequisites()[name];
    }

    const setPrerequisitesValue = (name: string, value: MadPrerequisite) => {
        return setPrerequisites(old => ({...old, [name]: value}));
    }

    const characterKeys = createMemo(() => Object.keys(Gandalf));
    const charRaceKeys = createMemo(() => Object.keys(Gandalf.race));
    const charProficienciesKeys = createMemo(() => Object.keys(Gandalf.proficiencies.skills));
    const charHealthKeys = createMemo(() => Object.keys(Gandalf.health));
    const charStatKeys = createMemo(() => Object.keys(Gandalf.stats));
    const charItemKeys = createMemo(() => Object.keys(Gandalf.items));
    const charCurrencyKeys = createMemo(() => Object.keys(Gandalf.items.currency));

    const operations = [
        "===",
        "!==",
        "includes",
        "excludes",
        ">",
        "<",
        ">=",
        "<=",
        "startsWith",
        "endsWith"
    ];

    const [prereqValue, setPrereqValue] = createSignal<string>("");
    const [prereqGroup, setPrereqGroup] = createSignal<number>(0);
    const [prereqOperation, setPrereqOperation] = createSignal<string>("");
    const [prereqKey, setPrereqKey] = createSignal<string>("");
    const [subPrereqKey, setSubPrereqKey] = createSignal<string>("");
    const [tertiaryKey, setTertiaryKey] = createSignal<string>("");

    const [hasSecondary, setHasSecondary] = createSignal<boolean>(false);
    const [hasTertiary, setHasTertiary] = createSignal<boolean>(false);

    const getPrettyOpName = (operation: string) => {
        switch (operation) {
            case "===":
                return "Equal To";
            
            case "!==":
                return "Not Equal To";
            
            case ">":
                return "Greater Than";

            case "<":
                return "Less Than"

            case ">=":
                return "Greater Than or Equal To"

            case "<=":
                return "Less Than or Equal To";
            
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

    const resetForm = () => {
        setPrereqKey("");
        setPrereqGroup(0);
        setPrereqValue("");
        setTertiaryKey("");
        setSubPrereqKey("");
        setPrereqOperation("");
    }

    const handleSubmit = (hasSecondary: boolean, hasTertiary: boolean) => {
        const value = prereqValue();
        const group = prereqGroup();
        const operation = prereqOperation();
        const FirstKey = prereqKey();
        const SecondaryKey = subPrereqKey();
        const TertiaryKey = tertiaryKey();
        
        const hasSecond = hasSecondary;
        const hasThird = hasTertiary;

        if (FirstKey === "" || FirstKey === undefined) {
            addSnackbar({
                message: "Must select a character trait!",
                severity: "error",
            })

            return;
        }

        
        if (operation === "" || operation === undefined) {
            addSnackbar({
                message: "Must select an operation!",
                severity: "error",
            });
            
            return;
        }
        
        if (value === "" || value === undefined) {
            addSnackbar({
                message: "Must input an value!",
                severity: "error",
            })

            return;
        }

        if (hasSecond && SecondaryKey === "" || SecondaryKey === undefined) {
            addSnackbar({
                message: "Must select the secondary key!",
                severity: "error"
            })

            return;
        }

        if (hasThird && TertiaryKey === "" || TertiaryKey === undefined) {
            addSnackbar({
                message: "Must select the tertiary key!",
                severity: "error"
            })

            return;
        }
        
        setPrerequisitesValue(`prerequisites ${prereqKeys().length + 1}`, {
            value: value,
            operation: operation,
            keyValue: FirstKey,
            secondaryValue: SecondaryKey ?? "",
            tertiaryValue: TertiaryKey ?? "",
            group: group
        })

        // const succses = props.Submit(group, operation, value, FirstKey, SecondaryKey, TertiaryKey);
        
        // if (succses) resetForm();
    }

    createEffect(() => {
        const key = prereqKey();
        const secondaryKey = subPrereqKey();
        
        // Determine if secondary key is needed
        const needsSecondary = ["race", "proficiencies", "health", "stats", "items"].includes(key);
        setHasSecondary(needsSecondary);
        
        // Determine if tertiary key is needed (only for currency)
        const needsTertiary = needsSecondary && key === "items" && secondaryKey === "currency";
        setHasTertiary(needsTertiary);
    }, [prereqKey, subPrereqKey])

    return <div class={`${style.leftAlignText}`}>
        <h2>Prerequisites</h2>

        <FlatCard headerName={<strong>Prerequisites</strong>} class={`${style.cardAlt}`}>

            <h2>Character Property</h2>
                
            <div>
                Pick which character trait or field you want to check.
            </div>

            <FormField formName="mad Character Key" name="Character Property" class={`${style.preReqInput}`}>
                <Select value={prereqKey()} onChange={(value)=>setPrereqKey(value)}>
                    <For each={characterKeys()}>
                        {key => <Option value={key}>{key}</Option>}
                    </For>
                </Select>
            </FormField>

            <Switch>
                <Match when={prereqKey() === "race"}>
                    <div>
                        Pick the race detail you want to check.
                    </div>

                    <FormField name="Race Detail" formName="mad Secondary Key" class={`${style.preReqInput}`}>
                        <Select value={subPrereqKey()} onChange={(value) => setSubPrereqKey(value)}>
                            <For each={charRaceKeys()}>
                                {key => <Option value={key}>{key}</Option>}
                            </For>
                        </Select>
                    </FormField>
                </Match>
                <Match when={prereqKey() === "proficiencies"}>
                    <div>
                        Pick the proficiency or skill you want to check.
                    </div>
                    
                    <FormField name="Skill" formName="mad Secondary Key" class={`${style.preReqInput}`}>
                        <Select value={subPrereqKey()} onChange={value => setSubPrereqKey(value)}>
                            <For each={charProficienciesKeys()}>
                                {key => <Option value={key}>{key}</Option>}
                            </For>
                        </Select>
                    </FormField>
                </Match>
                <Match when={prereqKey() === "health"}>
                    <div>
                        Which hit point(HP) type do you want to compare?
                    </div>

                    <FormField name="HP Type" formName="mad Secondary Key" class={`${style.preReqInput}`}>
                        <Select value={subPrereqKey()} onChange={(value) => setSubPrereqKey(value)}>
                            <For each={charHealthKeys()}>
                                {key => <Option value={key}>{key}</Option>}
                            </For>
                        </Select>
                    </FormField>
                </Match>
                <Match when={prereqKey() === "stats"}>
                    <div>
                        Which stat do you want to compare?
                    </div>
                    
                    <FormField name="Stat" formName="mad Secondary Key" class={`${style.preReqInput}`}>
                        <Select value={subPrereqKey()} onChange={value => setSubPrereqKey(value)}>
                            <For each={charStatKeys()}>
                                {key => <Option value={key}>{key}</Option>}
                            </For>
                        </Select>
                    </FormField>
                </Match>
                <Match when={prereqKey() === "items"}>
                    <div>
                        Which inventory do you want to compare?
                    </div>

                    <FormField name="inventory" formName="mad Secondary Key" class={`${style.preReqInput}`}>
                        <Select value={subPrereqKey()} onChange={value => setSubPrereqKey(value)}>
                            <For each={charItemKeys()}>
                                {key => <Option value={key}>{key}</Option>}
                            </For>
                        </Select>
                    </FormField>

                    <Show when={subPrereqKey() === "currency"}>
                        <div>
                            <div>
                                Which currency type do you want to compare?
                            </div>

                            <FormField name="Currency Type" formName="mad Tertiary Key" class={`${style.preReqInput}`}>
                                <Select value={tertiaryKey()} onChange={value => setTertiaryKey(value)}>
                                    <For each={charCurrencyKeys()}>
                                        {key => <Option value={key}>{key}</Option>}
                                    </For>
                                </Select>
                            </FormField>
                        </div>
                    </Show>
                </Match>
            </Switch>

            <h2>Prerequisite Operation</h2>
        
            <div>
                Choose how to compare the character value. For example, if the rule is "Strength Score = 15", choose Equal To.
            </div>

            <FormField formName="mad Prereq Operation" name="Prerequisite Operation" class={`${style.preReqInput}`}>
                <Select value={prereqOperation()} onChange={(value) => setPrereqOperation(value)}>
                    <For each={operations}>
                        {operation => <Option value={operation}>{getPrettyOpName(operation)}</Option>}
                    </For>
                </Select>
            </FormField>

            <h2>prerequisite Value</h2>

            <div>
                Enter the value to compare against the character. For example, if the rule is "Strength Score = 15", enter 15.
            </div>

            <FormField formName="mad Prereq Value" name="prerequisite Value" class={`${style.preReqInput}`}>
                <Input value={prereqValue()} onInput={(e) => setPrereqValue(e.currentTarget.value)} />
            </FormField>


            <h2>Group Number</h2>
            
            <div>
                Use a group number to combine prerequisite rules.
                
                <ul>
                    <li>Rules with the same group number are treated as "or" - only one of them needs to be true.</li>
                    <li>Rules with different group numbers are treated as "and" - they all need to be true.</li>
                </ul>
                    
            </div>

            <FormField formName="mad Prereq Group" name="Group Number" class={`${style.preReqInput}`}>
                <Input min={0} value={prereqGroup()} type="number" onInput={(e) => setPrereqGroup(+e.currentTarget.value)}/>
            </FormField>

            <Button onClick={()=>handleSubmit(hasSecondary(),hasTertiary())}>Add Prerequisite</Button>
        </FlatCard>

        <Show when={prereqKeys().length > 0} fallback={<div>
            No Prerequisites
        </div>}>
            <div class={`${style.preReqsBox}`}>
                <For each={prereqKeys()}>
                    {key => {
                        const prerequisite = getPrerequisites(key);

                        const firstKey = prerequisite.keyValue;
                        const secondKey = prerequisite.secondaryValue ?? "";
                        const thirdKey = prerequisite.tertiaryValue ?? "";
                        const operation = prerequisite.operation ?? "";
                        const value = prerequisite.value ?? "";
                        const group = prerequisite.group;

                        
                        return <span class={`${style.preReqChip}`}>
                            <div class={style.preReqRule}>
                                <strong>Rule:</strong> {firstKey}
                                {secondKey !== "" ? ` → ${secondKey}` : ""}
                                {thirdKey !== "" ? ` → ${thirdKey}` : ""}
                                <div>
                                    <strong>{getPrettyOpName(operation)}</strong> {value}
                                </div>
                            </div>
                            <div>
                                <strong>Group:</strong> {group}
                            </div>
                        </span>

                    }}
                </For>
            </div>
        </Show>

    </div>
}
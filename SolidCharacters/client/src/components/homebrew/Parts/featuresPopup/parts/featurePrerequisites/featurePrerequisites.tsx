import { Component, createMemo, createSignal, For, Match, Switch } from "solid-js";
import { Gandalf } from "../../../../../../shared/customHooks/dndInfo/useExampleChars";
import { Character, CharacterRace } from "../../../../../../models/character.model";
import { FormField, Input, Option, Select } from "coles-solid-library";
import style from "./featurePrerequisites.module.scss";

export const FeaturePrerequisites: Component = () => {
    
    const characterKeys = createMemo(() => Object.keys(Gandalf));
    const charRaceKeys = createMemo(() => Object.keys(Gandalf.race));
    const charProficienciesKeys = createMemo(() => Object.keys(Gandalf.proficiencies));
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

    const getKeyType = (key: string) => {
        const value = Gandalf[key as keyof Character];
     
        switch (typeof value) {
            case "string":
                return "string";
            
            case "number":
                return "number"

            case "object":
                
                if (Array.isArray(value)) {
                    return "array"
                } else if (value === null) {
                    return "null"
                } else {
                    return "object"
                }

            default:
                return "undefined";
        }
    };

    const getRaceKeyType = (key: string) => {
        const value = Gandalf.race[key as keyof Character['race']];
     
        switch (typeof value) {
            case "string":
                return "string";
            
            case "number":
                return "number"

            case "object":
                
                if (Array.isArray(value)) {
                    return "array"
                } else if (value === null) {
                    return "null"
                } else {
                    return "object"
                }

            default:
                return "undefined";
        }
    };


    return <div style={{"text-align": "left"}}>
        <h2>Prerequisites</h2>

        <h2>Character Property</h2>
            
        <div>
            The property on the charcter sheet to check. For example, If the prerequisite is "Strength Score = 15", the properpty would "Strength Score".
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
                which part of the race do you want to compare?

                <Select value={subPrereqKey()} onChange={(value) => setSubPrereqKey(value)}>
                    <For each={charRaceKeys()}>
                        {key => <Option value={key}>{key}</Option>}
                    </For>
                </Select>
            </Match>
            <Match when={prereqKey() === "proficiencies"}>
                asdf
            </Match>
            <Match when={prereqKey() === "health"}>
                asdf
            </Match>
            <Match when={prereqKey() === "stats"}>
                asdff
            </Match>
            <Match when={prereqKey() === "items"}>
                asdfaxCV
            </Match>
        </Switch>

        <h2>Prerequisite Operation</h2>
    
        <div>
            The mathmatcial operation used to compare the value on the character sheet. For example, If the prerequisite is "Strength Score = 15", The operation would be "=".
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
            The main value used to compare to the value on the character sheet. For example, If the prerequisite is "Strength Score = 15", Value would be 15.
        </div>

        <FormField formName="mad Prereq Value" name="prerequisite Value" class={`${style.preReqInput}`}>
            <Input value={prereqValue()} onInput={(e) => setPrereqValue(e.currentTarget.value)} />
        </FormField>


        <h2>Group Number</h2>
        
        <div>
            the group number for prerequisites.
            
            <ul>
                <li>prerequisites with the same group number are "or" prerequisites</li>
                <li>prerequisites with opposite are "and" prerequisites</li>
            </ul>
                
        </div>

        <FormField formName="mad Prereq Group" name="Group Number" class={`${style.preReqInput}`}>
            <Input value={prereqGroup()} type="number" onInput={(e) => setPrereqGroup(+e.currentTarget.value)}/>
        </FormField>


    </div>
}
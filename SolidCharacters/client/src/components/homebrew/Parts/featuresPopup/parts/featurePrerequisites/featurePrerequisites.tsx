import { Component, createMemo, createSignal, For } from "solid-js";
import { Gandalf } from "../../../../../../shared/customHooks/dndInfo/useExampleChars";
import { Character } from "../../../../../../models/character.model";
import { FormField, Input, Option, Select } from "coles-solid-library";

export const FeaturePrerequisites: Component = () => {
    
    const characterKeys = createMemo(() => {
        const allKeys = Object.keys(Gandalf);

        return allKeys.reduce((updatedKeys, key) => {
            if (Array.isArray(Gandalf?.[key as keyof Character])) {
                return updatedKeys.filter(old => old !== key);
            }

            return updatedKeys;
        }, allKeys)
    });
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
    const groupNumbers = [0,1];

    const [prereqValue, setPrereqValue] = createSignal<string>("");
    const [prereqGroup, setPrereqGroup] = createSignal<0|1>(0);
    const [prereqOperation, setPrereqOperation] = createSignal<string>("");
    const [prereqKey, setPrereqKey] = createSignal<string>("");

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

            default:
                return operation;
        }
    }

    return <div>
        <h2>Character Property</h2>
            
        <div>
            The property on the charcter sheet to check. For example, If the prerequisite is "Strength Score = 15", the properpty would "Strength Score".
        </div>

        <FormField formName="mad Character Key" name="Character Property">
            <Select value={prereqKey()} onChange={(value)=>setPrereqKey(value)}>
                <For each={characterKeys()}>
                    {key => <Option value={key}>{key}</Option>}
                </For>
            </Select>
        </FormField>

        <h2>Prerequisite Operation</h2>
    
        <div>
            The mathmatcial operation used to compare the value on the character sheet. For example, If the prerequisite is "Strength Score = 15", The operation would be "=".
        </div>

        <FormField formName="mad Prereq Operation" name="Prerequisite Operation">
            <Select value={prereqOperation()} onChange={(value) => setPrereqOperation(value)}>
                <For each={operations}>
                    {operation => <Option value={getPrettyOpName(operation)}></Option>}
                </For>
            </Select>
        </FormField>

        <h2>prerequisite Value</h2>

        <div>
            The main value used to compare to the value on the character sheet. For example, If the prerequisite is "Strength Score = 15", Value would be 15.
        </div>

        <FormField formName="mad Prereq Value" name="prerequisite Value">
            <Input value={prereqValue()} onInput={(e) => setPrereqValue(e.currentTarget.value)} />
        </FormField>

        <h2>Group Number</h2>
        
        <div>
            The group number for prerequisites, prerequisites with the group number of 1 means any must be true and, prerequisites with the group number of 0 all must be true.   
        </div>

        <FormField formName="mad Prereq Group" name="Group Number">
            <Select value={prereqGroup()} onChange={(value) => setPrereqGroup(value)}>
                <For each={groupNumbers}>
                    {group => <Option value={group}>Group {group}</Option>}
                </For>
            </Select>
        </FormField>

    </div>
}
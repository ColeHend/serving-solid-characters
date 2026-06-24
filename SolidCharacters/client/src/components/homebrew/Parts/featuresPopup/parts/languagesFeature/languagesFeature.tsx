import { Button, FormField, Option, Select } from "coles-solid-library";
import { Accessor, Component, createMemo, createSignal, For } from "solid-js";

interface props {
    toggleValue: (languages: string) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

export const LanguagesFeature:Component<props> = (props) => {

    const madValue = createMemo(() => props.getValue());    
    const allLanguages = [
        'Common',
        "Undercommon",
        "Abyssal",
        "Infernal",
        "Celestial",
        "Primordial",
        "Draconic",
        "Dwarvish",
        "Elvish",
        "Giant",
        "Gnomish",
        "Goblin",
        "Halfling",
        "Orc",
        "Sylvan",
        "Deep Speech",
    ];

    const [currLanguage, setLanguage] = createSignal<string>("");

    const getMadValue = (key: string) => {
        return madValue()?.[key];
    }

    return <div>
        <div>
            <FormField name="Selected Language">
                <Select value={getMadValue("name")} onChange={(val) => setLanguage(val)}>
                    <For each={allLanguages}>
                        {(lang) => <Option value={lang}>{lang}</Option>}
                    </For>
                </Select>
            </FormField>
        </div>
        <p>
            <strong>Selected Language: </strong>
            {currLanguage() || "None"}
        </p>
        <Button onClick={()=>props.toggleValue(currLanguage())}>Set Languages</Button>
    </div>
}
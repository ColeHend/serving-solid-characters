import { Button, FormField, Option, Select } from "coles-solid-library";
import { Accessor, Component, createMemo, createSignal, For } from "solid-js";

interface props {
    toggleProf: (proficiencies: string[]) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

export const ProficienciesFeature: Component<props> = (props) => {

    const madValue = createMemo(() => props.getValue());

    const getMadValue = (key: string) => {
        return madValue()?.[key];
    }

    const profs = createMemo(() => getMadValue("proficiencies")?.split(",") ?? []);

    const [currProfs, setProfs] = createSignal<string[]>([]);

    const skills = [
        "Acrobatics",
        "Animal Handling",
        "Sleight Of Hand",
        "Arcana",
        "History",
        "Athletics",
        "Deception",
        "Insight",
        "Intimidation",
        "Investigation",
        "Medicine",
        "Nature",
        "Perception",
        "Performance",
        "Persuasion",
        "Religion",
        "Stealth",
        "Survival"
    ]

    return <div>
        <FormField name="Select Skills">
            <Select value={profs()} onChange={(val) => setProfs(val)} multiple>
                <For each={skills}>
                    {skill => <Option value={skill}>{skill}</Option>}
                </For>
            </Select>
        </FormField>

        <Button onClick={()=>props.toggleProf(currProfs())}>
            Set Proficiencies
        </Button>
    </div>
}
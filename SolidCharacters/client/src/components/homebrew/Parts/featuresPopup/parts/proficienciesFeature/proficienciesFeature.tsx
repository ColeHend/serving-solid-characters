import { Button, Checkbox, FormField, Input, Option, Select } from "coles-solid-library";
import { Accessor, Component, createMemo, createSignal, For, Show } from "solid-js";

interface props {
    toggleProf: (proficiencies: string, extra?: { options?: string; count?: string }) => void;
    getValue: Accessor<Record<string, string> | undefined>;
    /** Enables the "player chooses" form (Proficiencies only — Expertise has no choice form). */
    allowChoice?: boolean;
}

export const ProficienciesFeature: Component<props> = (props) => {

    const madValue = createMemo(() => props.getValue());

    const getMadValue = (key: string) => {
        return madValue()?.[key];
    }

    const profs = createMemo(() => getMadValue("proficiency") ?? "");

    const [currProfs, setProfs] = createSignal<string>(profs() === "choice" ? "" : profs());
    const [isChoice, setIsChoice] = createSignal(profs() === "choice");
    const [options, setOptions] = createSignal<string[]>((getMadValue("options") ?? "").split(",").map(s => s.trim()).filter(Boolean));
    const [count, setCount] = createSignal(+(getMadValue("count") ?? "1") || 1);

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

    const toggleOption = (skill: string) => {
        setOptions(old => old.includes(skill) ? old.filter(o => o !== skill) : [...old, skill]);
    };

    const commit = () => {
        if (isChoice()) {
            props.toggleProf("choice", { options: options().join(","), count: `${count()}` });
        } else {
            props.toggleProf(currProfs());
        }
    };

    return <div>
        <Show when={props.allowChoice}>
            <Checkbox
                label="Let the player choose the skill(s)"
                checked={isChoice()}
                onChange={() => setIsChoice(v => !v)}
            />
        </Show>

        <Show when={!isChoice()}>
            <FormField name="Select Skills">
                <Select value={currProfs()} onChange={(val) => setProfs(val)}>
                    <For each={skills}>
                        {skill => <Option value={skill}>{skill}</Option>}
                    </For>
                </Select>
            </FormField>
        </Show>

        <Show when={isChoice()}>
            <FormField name="Allowed skills">
                <div>
                    <For each={skills}>
                        {(skill) => (
                            <Checkbox
                                label={skill}
                                checked={options().includes(skill)}
                                onChange={() => toggleOption(skill)}
                            />
                        )}
                    </For>
                </div>
            </FormField>

            <FormField name="How many the player picks">
                <Input value={count()} type="number" min={1} onInput={(e) => setCount(Math.max(1, +e.currentTarget.value || 1))} />
            </FormField>
        </Show>

        <Button disabled={isChoice() && options().length === 0} onClick={commit}>
            Set Change
        </Button>
    </div>
}

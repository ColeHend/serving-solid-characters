import { Button, Checkbox, FormField, Input, Option, Select } from "coles-solid-library";
import { Accessor, Component, createMemo, createSignal, For, Show } from "solid-js";
import { ARMOR_KEYS } from "../../../../../../shared/ai/commands/madCommandCatalog";
import { OptionsMultiSelect } from "../optionsMultiSelect/optionsMultiSelect";

interface props {
    toggleProf: (armor: string, extra?: { options?: string; count?: string }) => void;
    getValue: Accessor<Record<string, string> | undefined>;
    /** Enables the "player chooses" form (Add only). */
    allowChoice?: boolean;
}

export const ArmorProfFeature: Component<props> = (props) => {
    const madValue = createMemo(() => props.getValue());

    const getMadValue = (key: string) => madValue()?.[key];

    const armor = createMemo(() => getMadValue("armor") ?? "");

    const [currArmor, setCurrArmor] = createSignal<string>(armor() === "choice" ? "" : armor() || "Light Armor");
    const [isChoice, setIsChoice] = createSignal(armor() === "choice");
    const [options, setOptions] = createSignal<string[]>((getMadValue("options") ?? "").split(",").map(s => s.trim()).filter(Boolean));
    const [count, setCount] = createSignal(+(getMadValue("count") ?? "1") || 1);

    const commit = () => {
        if (isChoice()) {
            props.toggleProf("choice", { options: options().join(","), count: `${count()}` });
        } else {
            props.toggleProf(currArmor());
        }
    };

    return <div>
        <Show when={props.allowChoice}>
            <Checkbox
                label="Let the player choose the armor"
                checked={isChoice()}
                onChange={() => setIsChoice(v => !v)}
            />
        </Show>

        <Show when={!isChoice()}>
            <FormField name="Armor Category">
                <Select value={currArmor()} onChange={setCurrArmor}>
                    <For each={[...ARMOR_KEYS]}>
                        {category => <Option value={category}>{category}</Option>}
                    </For>
                </Select>
            </FormField>
        </Show>

        <Show when={isChoice()}>
            <OptionsMultiSelect
                label="Allowed armor categories"
                options={[...ARMOR_KEYS]}
                selected={options}
                onChange={setOptions}
            />

            <FormField name="How many the player picks">
                <Input value={count()} type="number" min={1} onChange={(e) => setCount(Math.max(1, +e.currentTarget.value || 1))} />
            </FormField>
        </Show>

        <Button disabled={isChoice() ? options().length === 0 : !currArmor()} onClick={commit}>
            Set Change
        </Button>
    </div>
}

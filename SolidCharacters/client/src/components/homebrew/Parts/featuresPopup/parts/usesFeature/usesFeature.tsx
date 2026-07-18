import { Accessor, Component, createMemo, createSignal, For, Show } from "solid-js";
import { Button, FormField, Input, Option, Select } from "coles-solid-library";

interface props {
    toggleValue: (amount: string, proficiencyBonus: string, recharge: string) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

const PB_CHOICES: { value: string; label: string }[] = [
    { value: "", label: "None (use the fixed amount)" },
    { value: "Third PB", label: "A third of the Proficiency Bonus" },
    { value: "Half PB", label: "Half the Proficiency Bonus" },
    { value: "Full PB", label: "The full Proficiency Bonus" },
];

export const UsesFeature: Component<props> = (props) => {
    const madValue = createMemo(() => props.getValue());

    const GetMadValue = (key: string): string => {
        return madValue()?.[key] || "";
    }

    const [amount, setAmount] = createSignal(GetMadValue("amount"));
    const [pbChoice, setPbChoice] = createSignal(GetMadValue("proficiencyBonus"));
    const [recharge, setRecharge] = createSignal(GetMadValue("recharge") || "Long Rest");

    const usable = createMemo(() => pbChoice() !== "" || +amount() > 0);

    return <div>
        <FormField name="Number of Uses">
            <Input min={1} value={amount()} type="number" onChange={(e) => setAmount(e.currentTarget.value)} />
        </FormField>

        <FormField name="Or Scale With the Proficiency Bonus">
            <Select value={pbChoice()} onChange={setPbChoice}>
                <For each={PB_CHOICES}>
                    {(pb) => <Option value={pb.value}>{pb.label}</Option>}
                </For>
            </Select>
        </FormField>

        <FormField name="Recharges On">
            <Select value={recharge()} onChange={setRecharge}>
                <Option value={"Short Rest"}>Short Rest</Option>
                <Option value={"Long Rest"}>Long Rest</Option>
            </Select>
        </FormField>

        <Show when={!usable()}>
            <p>Enter a number of uses or pick a Proficiency Bonus fraction.</p>
        </Show>

        <Button disabled={!usable()} onClick={() => props.toggleValue(pbChoice() ? "" : amount().trim(), pbChoice(), recharge())}>
            Set Uses
        </Button>
    </div>
}

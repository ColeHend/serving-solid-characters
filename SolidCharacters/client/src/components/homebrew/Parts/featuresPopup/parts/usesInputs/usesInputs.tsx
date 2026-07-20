import { Accessor, Component, For } from "solid-js";
import { FormField, Input, Option, Select } from "coles-solid-library";

export const PB_CHOICES: { value: string; label: string }[] = [
    { value: "", label: "None (use the fixed amount)" },
    { value: "Third PB", label: "A third of the Proficiency Bonus" },
    { value: "Half PB", label: "Half the Proficiency Bonus" },
    { value: "Full PB", label: "The full Proficiency Bonus" },
];

interface props {
    amount: Accessor<string>;
    setAmount: (value: string) => void;
    pbChoice: Accessor<string>;
    setPbChoice: (value: string) => void;
    recharge: Accessor<string>;
    setRecharge: (value: string) => void;
    /** Label for the fixed-amount field; the Actions form marks it optional. */
    amountLabel?: string;
}

/** The limited-use editor trio (fixed amount / PB fraction / recharge) shared by the Uses and Actions forms. */
export const UsesInputs: Component<props> = (props) => {
    return <>
        <FormField name={props.amountLabel ?? "Number of Uses"}>
            <Input min={1} value={props.amount()} type="number" onChange={(e) => props.setAmount(e.currentTarget.value)} />
        </FormField>

        <FormField name="Or Scale With the Proficiency Bonus">
            <Select value={props.pbChoice()} onChange={props.setPbChoice}>
                <For each={PB_CHOICES}>
                    {(pb) => <Option value={pb.value}>{pb.label}</Option>}
                </For>
            </Select>
        </FormField>

        <FormField name="Recharges On">
            <Select value={props.recharge()} onChange={props.setRecharge}>
                <Option value={"Short Rest"}>Short Rest</Option>
                <Option value={"Long Rest"}>Long Rest</Option>
            </Select>
        </FormField>
    </>;
};

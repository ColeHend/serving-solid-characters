import { Accessor, Component, createMemo, createSignal } from "solid-js";
import { Button, FormField, Input, Option, Select } from "coles-solid-library";

interface props {
    toggleValue: (amount: number, recharge: string) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

export const UsesFeature: Component<props> = (props) => {
    const madValue = createMemo(() => props.getValue());

    const GetMadValue = (key: string): string => {
        return madValue()?.[key] || "";
    }

    const [amount, setAmount] = createSignal(+GetMadValue("amount") || 1);
    const [recharge, setRecharge] = createSignal(GetMadValue("recharge") || "Long Rest");

    return <div>
        <FormField name="Number of Uses">
            <Input min={1} value={amount()} type="number" onInput={(e) => setAmount(+e.currentTarget.value)} />
        </FormField>

        <FormField name="Recharges On">
            <Select value={recharge()} onChange={setRecharge}>
                <Option value={"Short Rest"}>Short Rest</Option>
                <Option value={"Long Rest"}>Long Rest</Option>
            </Select>
        </FormField>

        <Button onClick={() => props.toggleValue(amount(), recharge())}>Set Uses</Button>
    </div>
}

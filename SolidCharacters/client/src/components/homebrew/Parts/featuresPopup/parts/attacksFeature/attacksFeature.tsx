import { Accessor, Component, createMemo, createSignal } from "solid-js";
import { Button, FormField, Input } from "coles-solid-library";

interface props {
    toggleValue: (amount: number) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

export const AttacksFeature: Component<props> = (props) => {
    const madValue = createMemo(() => props.getValue());

    const GetMadValue = (key: string): string => {
        return madValue()?.[key] || "";
    }

    const [amount, setAmount] = createSignal(+GetMadValue("amount") || 1);

    return <div>
        <FormField name="Additional Attacks per Action">
            <Input min={1} value={amount()} type="number" onInput={(e) => setAmount(+e.currentTarget.value)} />
        </FormField>

        <Button onClick={() => props.toggleValue(amount())}>Set Attacks</Button>
    </div>
}

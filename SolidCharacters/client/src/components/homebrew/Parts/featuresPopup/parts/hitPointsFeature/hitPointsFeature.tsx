import { Button, Checkbox, FormField, Input } from "coles-solid-library";
import { Accessor, Component, createMemo, createSignal } from "solid-js";

interface props {
    toggleValue: (amount: number, perLevel: boolean) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

export const HitPointsFeature: Component<props> = (props) => {
    const madValue = createMemo(() => props.getValue());

    const GetMadValue = (key: string): string => {
        return madValue()?.[key] || "";
    }

    const [currentAmount, setAmount] = createSignal(+GetMadValue("amount") || 0);
    const [perLevel, setPerLevel] = createSignal(GetMadValue("perLevel") === "true");

    return <div>
        <FormField name="Hit Point Maximum Change">
            <Input value={currentAmount()} type="number" onInput={(e) => setAmount(+e.currentTarget.value)} />
        </FormField>

        <Checkbox
            label="Per level (scales with character level)"
            checked={perLevel()}
            onChange={() => setPerLevel(v => !v)}
        />

        <Button onClick={() => props.toggleValue(currentAmount(), perLevel())}>Update Hit Points</Button>

        <p>
            <strong>Hit Point Maximum: </strong>
            <span>{currentAmount() >= 0 ? "+" : ""}{currentAmount()}</span>
            <span>{perLevel() ? " per level" : ""}</span>
        </p>
    </div>
}

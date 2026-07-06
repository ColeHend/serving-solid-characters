import { Button, FormField, Input, Option, Select } from "coles-solid-library";
import { Accessor, Component, For, createMemo, createSignal } from "solid-js";

interface props {
    toggleValue: (sense: string, range: number) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

const SENSES = ["darkvision", "blindsight", "tremorsense", "truesight"];

export const SensesFeature: Component<props> = (props) => {
    const madValue = createMemo(() => props.getValue());

    const GetMadValue = (key: string): string => {
        return madValue()?.[key] || "";
    }

    const getSenseName = (sense: string): string => sense.charAt(0).toUpperCase() + sense.slice(1);

    const [currentSense, setSense] = createSignal(GetMadValue("sense") || "darkvision");
    const [currentRange, setRange] = createSignal(+GetMadValue("range") || 60);

    return <div>
        <FormField name="Sense">
            <Select value={currentSense()} onChange={(val) => setSense(val)}>
                <For each={SENSES}>
                    {sense => <Option value={sense}>{getSenseName(sense)}</Option>}
                </For>
            </Select>
        </FormField>

        <FormField name="Range (feet)">
            <Input value={currentRange()} type="number" onInput={(e) => setRange(+e.currentTarget.value)} />
        </FormField>

        <Button onClick={() => props.toggleValue(currentSense(), currentRange())}>Update Sense</Button>

        <p>
            <strong>Sense: </strong>
            <span>{getSenseName(currentSense())}</span> <span>{currentRange()} ft</span>
        </p>
    </div>
}

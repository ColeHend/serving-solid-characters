import { Button, Checkbox, FormField, Input } from "coles-solid-library";
import { Accessor, Component, createMemo, createSignal } from "solid-js";

interface props {
    toggleValue: (speed: number, mode?: string) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

export const SpeedFeature: Component<props> = (props) => {
    const madValue = createMemo(() => props.getValue());


    const GetMadValue = (key: string): string => {
        return madValue()?.[key] || "";
    }
    const speed = createMemo(() => +GetMadValue("speed"));
    const [currentSpeed, setSpeed] = createSignal(speed());
    const [isSet, setIsSet] = createSignal(GetMadValue("mode") === "set");

    return <div>
        <FormField name={isSet() ? "Walking Speed" : "Speed Increase"}>
            <Input value={currentSpeed()} type="number" onInput={(e) => setSpeed(+e.currentTarget.value)} />
        </FormField>

        <Checkbox
            label="Set the walking speed to this value (instead of adding to it)"
            checked={isSet()}
            onChange={() => setIsSet(v => !v)}
        />

        <Button onClick={()=>props.toggleValue(currentSpeed(), isSet() ? "set" : undefined)}>Update Speed</Button>
    </div>
}
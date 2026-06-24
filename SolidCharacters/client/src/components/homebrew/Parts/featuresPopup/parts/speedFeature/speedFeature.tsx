import { Button, FormField, Input } from "coles-solid-library";
import { Accessor, Component, createMemo, createSignal } from "solid-js";

interface props {
    toggleValue: (speed: number) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

export const SpeedFeature: Component<props> = (props) => {
    const madValue = createMemo(() => props.getValue());

    
    const GetMadValue = (key: string): string => {
        return madValue()?.[key] || "";
    }
    const speed = createMemo(() => +GetMadValue("speed"));
    const [currentSpeed, setSpeed] = createSignal(speed());

    return <div>
        <FormField name="Speed Increase">
            <Input value={currentSpeed()} type="number" onInput={(e) => setSpeed(+e.currentTarget.value)} />
        </FormField>
    
        <Button onClick={()=>props.toggleValue(currentSpeed())}>Set Increase</Button>
    </div>
}
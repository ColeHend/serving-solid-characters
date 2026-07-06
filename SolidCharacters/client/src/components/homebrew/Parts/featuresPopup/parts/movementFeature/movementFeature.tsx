import { Button, Checkbox, FormField, Input, Option, Select } from "coles-solid-library";
import { Accessor, Component, For, Show, createMemo, createSignal } from "solid-js";

interface props {
    /** speed is omitted when the mode moves at the character's walking speed. */
    toggleValue: (movementType: string, speed?: number) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

const MOVEMENT_TYPES = ["fly", "swim", "climb", "burrow", "walk"];

export const MovementFeature: Component<props> = (props) => {
    const madValue = createMemo(() => props.getValue());

    const GetMadValue = (key: string): string => {
        return madValue()?.[key] || "";
    }

    const getTypeName = (type: string): string => type.charAt(0).toUpperCase() + type.slice(1);

    const [currentType, setType] = createSignal(GetMadValue("movementType") || "fly");
    // no stored speed = the mode moves at the character's walking speed
    const [matchesWalking, setMatchesWalking] = createSignal(!GetMadValue("speed"));
    const [currentSpeed, setSpeed] = createSignal(+GetMadValue("speed") || 0);

    const commit = () => {
        props.toggleValue(currentType(), matchesWalking() ? undefined : currentSpeed());
    };

    return <div>
        <FormField name="Movement type">
            <Select value={currentType()} onChange={(val) => setType(val)}>
                <For each={MOVEMENT_TYPES}>
                    {type => <Option value={type}>{getTypeName(type)}</Option>}
                </For>
            </Select>
        </FormField>

        <Checkbox
            label="Speed equals the character's walking speed"
            checked={matchesWalking()}
            onChange={() => setMatchesWalking(v => !v)}
        />

        <Show when={!matchesWalking()}>
            <FormField name="Speed (feet)">
                <Input value={currentSpeed()} type="number" onInput={(e) => setSpeed(+e.currentTarget.value)} />
            </FormField>
        </Show>

        <Button onClick={commit}>Update Movement</Button>

        <p>
            <strong>Movement: </strong>
            <span>{getTypeName(currentType())}</span> <span>{matchesWalking() ? "(walking speed)" : `${currentSpeed()} ft`}</span>
        </p>
    </div>
}

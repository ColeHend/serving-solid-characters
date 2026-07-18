import { Accessor, Component, createMemo, createSignal, For, Show } from "solid-js";
import { Button, FormField, Input, Option, Select, TextArea } from "coles-solid-library";

interface props {
    toggleValue: (name: string, actionType: string, description: string) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

const ACTION_TYPES: { value: string; label: string }[] = [
    { value: "action", label: "Action" },
    { value: "bonusAction", label: "Bonus Action" },
    { value: "reaction", label: "Reaction" },
];

export const ActionsFeature: Component<props> = (props) => {
    const madValue = createMemo(() => props.getValue());

    const GetMadValue = (key: string): string => {
        return madValue()?.[key] || "";
    }

    const [name, setName] = createSignal(GetMadValue("name"));
    const [actionType, setActionType] = createSignal(GetMadValue("actionType") || "action");
    const [description, setDescription] = createSignal(GetMadValue("description"));

    const usable = createMemo(() => name().trim() !== "");

    return <div>
        <FormField name="Action Name">
            <Input
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
                placeholder="e.g. Channel Divinity"
            />
        </FormField>

        <FormField name="Action Type">
            <Select value={actionType()} onChange={setActionType}>
                <For each={ACTION_TYPES}>
                    {(at) => <Option value={at.value}>{at.label}</Option>}
                </For>
            </Select>
        </FormField>

        <FormField name="" variant="filled">
            <TextArea
                text={description}
                setText={setDescription}
                placeholder=", e.g. spend one use to invoke divine energy  (optional)"
            />
        </FormField>

        <Show when={!usable()}>
            <p>Enter the action's name.</p>
        </Show>

        <Button disabled={!usable()} onClick={() => props.toggleValue(name().trim(), actionType(), description().trim())}>
            Set Action
        </Button>
    </div>
}

import { Accessor, Component, createMemo, createSignal, For, Show } from "solid-js";
import { Button, FormField, Input, Option, Select, TextArea } from "coles-solid-library";
import { UsesInputs } from "../usesInputs/usesInputs";

interface props {
    toggleValue: (name: string, actionType: string, description: string, amount: string, proficiencyBonus: string, recharge: string) => void;
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
    const [amount, setAmount] = createSignal(GetMadValue("amount"));
    const [pbChoice, setPbChoice] = createSignal(GetMadValue("proficiencyBonus"));
    const [recharge, setRecharge] = createSignal(GetMadValue("recharge") || "Long Rest");

    const usable = createMemo(() => name().trim() !== "");
    // Uses are optional here: a PB pick clears the fixed amount, and 0/blank means unlimited.
    const usableAmount = () => (pbChoice() || +amount() <= 0) ? "" : amount().trim();

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

        <UsesInputs
            amount={amount} setAmount={setAmount}
            pbChoice={pbChoice} setPbChoice={setPbChoice}
            recharge={recharge} setRecharge={setRecharge}
            amountLabel="Number of Uses (optional)"
        />

        <Show when={!usable()}>
            <p>Enter the action's name.</p>
        </Show>

        <Button
            disabled={!usable()}
            onClick={() => props.toggleValue(
                name().trim(),
                actionType(),
                description().trim(),
                usableAmount(),
                pbChoice(),
                recharge(),
            )}
        >
            Set Action
        </Button>
    </div>
}

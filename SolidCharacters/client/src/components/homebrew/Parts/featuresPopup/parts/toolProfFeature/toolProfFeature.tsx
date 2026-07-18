import { Button, Checkbox, FormField, Input } from "coles-solid-library";
import { Accessor, Component, createMemo, createSignal, Show } from "solid-js";

interface props {
    toggleProf: (tool: string, extra?: { options?: string; count?: string }) => void;
    getValue: Accessor<Record<string, string> | undefined>;
    /** Enables the "player chooses" form (Add only). */
    allowChoice?: boolean;
}

export const ToolProfFeature: Component<props> = (props) => {
    const madValue = createMemo(() => props.getValue());

    const getMadValue = (key: string) => madValue()?.[key];

    const tool = createMemo(() => getMadValue("tool") ?? "");

    const [currTool, setCurrTool] = createSignal(tool() === "choice" ? "" : tool());
    const [isChoice, setIsChoice] = createSignal(tool() === "choice");
    const [options, setOptions] = createSignal(getMadValue("options") ?? "");
    const [count, setCount] = createSignal(+(getMadValue("count") ?? "1") || 1);

    const optionsList = createMemo(() => options().split(",").map(s => s.trim()).filter(Boolean));

    const commit = () => {
        if (isChoice()) {
            props.toggleProf("choice", { options: optionsList().join(","), count: `${count()}` });
        } else {
            props.toggleProf(currTool().trim());
        }
    };

    return <div>
        <Show when={props.allowChoice}>
            <Checkbox
                label="Let the player choose the tool(s)"
                checked={isChoice()}
                onChange={() => setIsChoice(v => !v)}
            />
        </Show>

        <Show when={!isChoice()}>
            <FormField name="Tool Name">
                <Input
                    value={currTool()}
                    onInput={(e) => setCurrTool(e.currentTarget.value)}
                    placeholder="e.g. Thieves' Tools"
                />
            </FormField>
        </Show>

        <Show when={isChoice()}>
            <FormField name="Allowed tools (comma-separated)">
                <Input
                    value={options()}
                    onInput={(e) => setOptions(e.currentTarget.value)}
                    placeholder="e.g. Smith's Tools, Brewer's Supplies, Mason's Tools"
                />
            </FormField>

            <FormField name="How many the player picks">
                <Input value={count()} type="number" min={1} onChange={(e) => setCount(Math.max(1, +e.currentTarget.value || 1))} />
            </FormField>
        </Show>

        <Button disabled={isChoice() ? optionsList().length === 0 : !currTool().trim()} onClick={commit}>
            Set Change
        </Button>
    </div>
}

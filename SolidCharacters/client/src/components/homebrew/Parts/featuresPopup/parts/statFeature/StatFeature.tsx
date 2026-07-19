import { Button, Checkbox, FormField, Input, Option, Select } from "coles-solid-library";
import { Accessor, Component, Show, createMemo, createSignal, For } from "solid-js";

interface props {
    toggleValue: (stat: string, value: number, extra?: { options?: string; mode?: string; count?: string }) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

export const StatFeature:Component<props> = (props) => {
    const madValue = createMemo(() => props.getValue());

    const stats = ["str", "dex", "con", "int", "wis", "cha"];

    const getStatName = (stat: string): string|undefined => {
        switch (stat) {
            case "str":
                return "Strength";
            case "dex":
                return "Dexterity";
            case "con":
                return "Constitution";
            case "int":
                return "Intelligence";
            case "wis":
                return "Wisdom";
            case "cha":
                return "Charisma";
            case "choice":
                return "Player's Choice";
        }
    }

    const GetMadValue = (key: string): string => {
        return madValue()?.[key] ?? "";
    }

    const stat = createMemo(() => GetMadValue("stat"));
    const statValue = createMemo(() => +GetMadValue("statValue"));

    const [currentStat, setStat] = createSignal(stat());
    const [currentStatValue, setStatValue] = createSignal(statValue());
    const [currentOptions, setOptions] = createSignal<string[]>(GetMadValue("options").split(",").map(s => s.trim()).filter(Boolean));
    const [currentCount, setCount] = createSignal(GetMadValue("count"));
    const [isSet, setIsSet] = createSignal(GetMadValue("mode") === "set");

    const toggleOption = (key: string) => {
        setOptions(old => old.includes(key) ? old.filter(o => o !== key) : [...old, key]);
    };

    const commit = () => {
        const extra: { options?: string; mode?: string; count?: string } = {};
        if (currentStat() === "choice") {
            extra.options = currentOptions().join(",");
            if (currentCount().trim()) extra.count = currentCount().trim();
        }
        if (isSet()) extra.mode = "set";
        props.toggleValue(currentStat(), currentStatValue(), extra);
    };

    return <div>
        <div>
            <FormField name="Choose a stat">
                <Select value={currentStat()} onChange={(val) => setStat(val)}>
                    <For each={[...stats, "choice"]}>
                        { stat => <Option value={stat}>{getStatName(stat)}</Option>}
                    </For>
                </Select>
            </FormField>

            <Show when={currentStat() === "choice"}>
                <FormField name="Allowed abilities">
                    <div>
                        <For each={stats}>
                            {(key) => (
                                <Checkbox
                                    label={getStatName(key) ?? key}
                                    checked={currentOptions().includes(key)}
                                    onChange={() => toggleOption(key)}
                                />
                            )}
                        </For>
                    </div>
                </FormField>
                <FormField name="How many the player picks">
                    <Input value={currentCount()} type="number" onChange={(e) => setCount(e.currentTarget.value)} />
                </FormField>
            </Show>

            <FormField name="Stat Value">
                <Input value={currentStatValue()} type="number" onChange={(e) => setStatValue(+e.currentTarget.value)} />
            </FormField>

            <Checkbox
                label="Set the score to this value (instead of adding to it)"
                checked={isSet()}
                onChange={() => setIsSet(v => !v)}
            />

            <Button onClick={commit}>Update Stat</Button>
        </div>
        <p>
            <strong>Chosen Stat: </strong>
            <span>{getStatName(currentStat()) ?? "None"}</span> <span>:</span> <span>{isSet() ? "set to" : "+"}</span> <span>{currentStatValue()}</span>
            <Show when={currentStat() === "choice"}>
                <span>{` (from ${currentOptions().join(", ") || "none selected"}${+currentCount() > 1 ? `, pick ${currentCount()} different` : ""})`}</span>
            </Show>
        </p>
    </div>
}

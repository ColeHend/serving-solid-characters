import { Button, FormField, Input, Option, Select } from "coles-solid-library";
import { Accessor, Component, createMemo, createSignal, For, Show } from "solid-js";

interface props {
    toggleAC: (bonus: number, stats: string[]) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

export const ACFeature: Component<props> = (props) => {

    const madValue = createMemo(() => props.getValue());

    const getMadValue = (key: string) => {
        return madValue()?.[key] ?? null;
    };

    const currBouns = createMemo(() => getMadValue("bonus") ?? "");
    const currStats = createMemo(() => getMadValue("stats")?.split(",") ?? []);

    const [bonus, setBonus] = createSignal<number>(+currBouns());
    const [selectedStats, setSelectedStats] = createSignal<string[]>(currStats());

    const stats = [
        "str",
        "dex",
        "con",
        "int",
        "wis",
        "cha"
    ]

    return <div>
        <FormField name="Armor Class Bonus">
            <Input value={bonus()} type="number" onInput={(e)=>setBonus(+e.currentTarget.value)} />
        </FormField>

        <FormField name="Optional Stat Modifier">
            <Select value={selectedStats()} onChange={(value)=>setSelectedStats(value)} multiple>
                <For each={stats}>
                    {stat => <Option value={stat}>{stat}</Option>}
                </For>
            </Select>
        </FormField>

        <p>
            AC = {bonus()} <Show when={selectedStats().length > 0}>+ {selectedStats().map(stat => ` ${stat} mod`).join(" + ")}</Show>
        </p>

        <Button onClick={()=>props.toggleAC(bonus(), selectedStats())}>Set Change</Button>
    </div>
}
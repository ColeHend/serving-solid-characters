import { Button, FormField, Input, Option, Select } from "coles-solid-library";
import { Component, createSignal, For, Show } from "solid-js";

interface props {
    toggleAC: (bonus: number, stats: string[]) => void;
}

export const ACFeature: Component<props> = (props) => {

    const [bonus, setBonus] = createSignal<number>(0);
    const [selectedStats, setSelectedStats] = createSignal<string[]>([]);

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

        <Button onClick={()=>props.toggleAC(bonus(), selectedStats())}>Set AC Bonus</Button>
    </div>
}
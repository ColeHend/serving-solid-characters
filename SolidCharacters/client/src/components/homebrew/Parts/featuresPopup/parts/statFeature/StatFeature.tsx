import { Button, FormField, Input, Option, Select } from "coles-solid-library";
import { Accessor, Component, createMemo, createSignal, For } from "solid-js";

interface props {
    toggleValue: (stat: string, value: number) => void;
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
        }
    }

    const GetMadValue = (key: string): string => {
        return madValue()?.[key] ?? "";
    }

    const stat = createMemo(() => GetMadValue("stat"));
    const statValue = createMemo(() => +GetMadValue("statValue"));

    const [currentStat, setStat] = createSignal(stat());
    const [currentStatValue, setStatValue] = createSignal(statValue());
    

    return <div>
        <div>
            <FormField name="Choose a stat">
                <Select value={currentStat()} onChange={(val) => setStat(val)}>
                    <For each={stats}>
                        { stat => <Option value={stat}>{getStatName(stat)}</Option>}
                    </For>
                </Select>
            </FormField>

            <FormField name="Stat Value">
                <Input value={currentStatValue()} type="number" onInput={(e) => setStatValue(+e.currentTarget.value)} />
            </FormField>

            <Button onClick={()=>props.toggleValue(currentStat(), currentStatValue())}>Update Stat</Button>
        </div>
        <p>
            <strong>Chosen Stat: </strong>
            <span>{getStatName(currentStat()) ?? "None"}</span> <span>:</span> <span>{currentStatValue()}</span>
        </p>
    </div>
}
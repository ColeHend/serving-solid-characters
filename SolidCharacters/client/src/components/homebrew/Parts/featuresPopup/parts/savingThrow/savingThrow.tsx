import { Accessor, Component, createMemo, createSignal, For, } from "solid-js";
import { Button, FormField, Option, Select } from "coles-solid-library";

interface props {
    toggleValue: (stat: string) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

export const SavingThrow: Component<props> = (props) => {
    const madValue = createMemo(() => props.getValue());

    const stats = [
        "str",
        "dex",
        "con",
        "int",
        "wis",
        "cha"
    ]

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
        return madValue() ? madValue()![key] : "";
    }

    const statName = createMemo(() => GetMadValue("stat"));
    const [currentStat, setStat] = createSignal(statName());

    const fullStatName = createMemo(() => getStatName(currentStat()));

    return <div>
        <FormField name="Choose a Stat">
            <Select value={currentStat()} onChange={setStat}>
                <For each={stats}>
                    { stat => <Option value={stat}>{getStatName(stat)}</Option>}
                </For>
            </Select>
        </FormField>

        <Button onClick={() => props.toggleValue(currentStat())}>
            Set Stat
        </Button>

        <p>
            <strong>Chosen Stat: </strong>
            <span>{fullStatName() ?? ""}</span>
        </p>
    </div>
}
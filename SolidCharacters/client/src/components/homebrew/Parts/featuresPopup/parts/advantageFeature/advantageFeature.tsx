import { Accessor, Component, createMemo, createSignal, For, Show } from "solid-js";
import { Button, FormField, Input, Option, Select } from "coles-solid-library";

interface props {
    toggleValue: (rollType: string, mode: string, stat: string, condition: string) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

const ROLL_TYPES: { value: string; label: string }[] = [
    { value: "SavingThrow", label: "Saving Throws" },
    { value: "WeaponAttack", label: "Weapon Attacks" },
    { value: "SpellAttack", label: "Spell Attacks" },
    { value: "Initiative", label: "Initiative" },
    { value: "AbilityCheck", label: "Ability Checks" },
];

const STATS = ["str", "dex", "con", "int", "wis", "cha"];

export const AdvantageFeature: Component<props> = (props) => {
    const madValue = createMemo(() => props.getValue());

    const GetMadValue = (key: string): string => {
        return madValue()?.[key] || "";
    }

    const [mode, setMode] = createSignal(GetMadValue("mode") || "advantage");
    const [rollType, setRollType] = createSignal(GetMadValue("rollType") || "SavingThrow");
    const [stat, setStat] = createSignal(GetMadValue("stat"));
    const [condition, setCondition] = createSignal(GetMadValue("condition"));

    const statPickable = createMemo(() => rollType() === "SavingThrow" || rollType() === "AbilityCheck");

    return <div>
        <FormField name="Advantage or Disadvantage">
            <Select value={mode()} onChange={setMode}>
                <Option value={"advantage"}>Advantage</Option>
                <Option value={"disadvantage"}>Disadvantage</Option>
            </Select>
        </FormField>

        <FormField name="On Which Rolls">
            <Select value={rollType()} onChange={setRollType}>
                <For each={ROLL_TYPES}>
                    {(rt) => <Option value={rt.value}>{rt.label}</Option>}
                </For>
            </Select>
        </FormField>

        <Show when={statPickable()}>
            <FormField name="Ability (optional)">
                <Select value={stat()} onChange={setStat}>
                    <Option value={""}>Any</Option>
                    <For each={STATS}>
                        {(s) => <Option value={s}>{s.toUpperCase()}</Option>}
                    </For>
                </Select>
            </FormField>
        </Show>

        <FormField name="Condition (optional)">
            <Input
                value={condition()}
                onInput={(e) => setCondition(e.currentTarget.value)}
                placeholder="e.g. against being frightened"
            />
        </FormField>

        <Button onClick={() => props.toggleValue(rollType(), mode(), statPickable() ? stat() : "", condition().trim())}>
            Set Advantage
        </Button>
    </div>
}

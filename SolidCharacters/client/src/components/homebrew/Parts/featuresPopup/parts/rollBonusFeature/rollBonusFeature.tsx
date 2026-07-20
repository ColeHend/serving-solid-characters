import { Accessor, Component, createMemo, createSignal, For, Show } from "solid-js";
import { Button, FormField, Input, Option, Select } from "coles-solid-library";

interface props {
    toggleValue: (rollType: string, bonus: string, proficiencyBonus: string, statBonus: string, stat: string, condition: string) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

const ROLL_TYPES: { value: string; label: string }[] = [
    { value: "SavingThrow", label: "Saving Throws" },
    { value: "WeaponAttack", label: "Weapon Attacks" },
    { value: "SpellAttack", label: "Spell Attacks" },
    { value: "Initiative", label: "Initiative" },
    { value: "AbilityCheck", label: "Ability Checks" },
];

const PB_CHOICES: { value: string; label: string }[] = [
    { value: "", label: "None (use the flat bonus)" },
    { value: "Third PB", label: "A third of the Proficiency Bonus" },
    { value: "Half PB", label: "Half the Proficiency Bonus" },
    { value: "Full PB", label: "The full Proficiency Bonus" },
];

const STATS = ["str", "dex", "con", "int", "wis", "cha"];

export const RollBonusFeature: Component<props> = (props) => {
    const madValue = createMemo(() => props.getValue());

    const GetMadValue = (key: string): string => {
        return madValue()?.[key] || "";
    }

    const [rollType, setRollType] = createSignal(GetMadValue("rollType") || "SavingThrow");
    const [bonus, setBonus] = createSignal(GetMadValue("bonus"));
    const [pbChoice, setPbChoice] = createSignal(GetMadValue("proficiencyBonus"));
    const [statBonus, setStatBonus] = createSignal(GetMadValue("statBonus"));
    const [stat, setStat] = createSignal(GetMadValue("stat"));
    const [condition, setCondition] = createSignal(GetMadValue("condition"));

    const statPickable = createMemo(() => rollType() === "SavingThrow" || rollType() === "AbilityCheck");
    const usable = createMemo(() => bonus().trim() !== "" || pbChoice() !== "" || statBonus() !== "");

    return <div>
        <FormField name="On Which Rolls">
            <Select value={rollType()} onChange={setRollType}>
                <For each={ROLL_TYPES}>
                    {(rt) => <Option value={rt.value}>{rt.label}</Option>}
                </For>
            </Select>
        </FormField>

        <FormField name="Flat Bonus">
            <Input
                value={bonus()}
                type="number"
                onInput={(e) => setBonus(e.currentTarget.value)}
                placeholder="e.g. 2"
            />
        </FormField>

        <FormField name="Or a Proficiency Bonus Fraction">
            <Select value={pbChoice()} onChange={setPbChoice}>
                <For each={PB_CHOICES}>
                    {(pb) => <Option value={pb.value}>{pb.label}</Option>}
                </For>
            </Select>
        </FormField>

        <FormField name="Add an Ability Modifier (optional)">
            <Select value={statBonus()} onChange={setStatBonus}>
                <Option value={""}>None</Option>
                <For each={STATS}>
                    {(s) => <Option value={s}>{s.toUpperCase()}</Option>}
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
                placeholder="e.g. with Ranged weapons"
            />
        </FormField>

        <Show when={!usable()}>
            <p>Enter a flat bonus, pick a Proficiency Bonus fraction, or pick an ability modifier to add.</p>
        </Show>

        <Button disabled={!usable()} onClick={() => props.toggleValue(rollType(), bonus().trim(), pbChoice(), statBonus(), statPickable() ? stat() : "", condition().trim())}>
            Set Roll Bonus
        </Button>
    </div>
}

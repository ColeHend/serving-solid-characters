import { Button, Checkbox, FormField, Input, Option, Select } from "coles-solid-library";
import { Accessor, Component, createMemo, createSignal, Show } from "solid-js";
import { WEAPON_CATEGORY_KEYS } from "../../../../../../shared/ai/commands/madCommandCatalog";

interface props {
    toggleProf: (weapon: string, extra?: { options?: string; count?: string }) => void;
    getValue: Accessor<Record<string, string> | undefined>;
    /** Enables the "player chooses" form (Add only). */
    allowChoice?: boolean;
}

const SPECIFIC = "__specific__";

export const WeaponProfFeature: Component<props> = (props) => {
    const madValue = createMemo(() => props.getValue());

    const getMadValue = (key: string) => madValue()?.[key];

    const weapon = createMemo(() => getMadValue("weapon") ?? "");
    const isCategory = (v: string) => (WEAPON_CATEGORY_KEYS as readonly string[]).includes(v);

    const [selected, setSelected] = createSignal<string>(
        weapon() === "choice" || !weapon() ? "Simple Weapons" : isCategory(weapon()) ? weapon() : SPECIFIC);
    const [specific, setSpecific] = createSignal(weapon() !== "choice" && !isCategory(weapon()) ? weapon() : "");
    const [isChoice, setIsChoice] = createSignal(weapon() === "choice");
    const [options, setOptions] = createSignal(getMadValue("options") ?? "");
    const [count, setCount] = createSignal(+(getMadValue("count") ?? "1") || 1);

    const grantValue = createMemo(() => selected() === SPECIFIC ? specific().trim() : selected());
    const optionsList = createMemo(() => options().split(",").map(s => s.trim()).filter(Boolean));

    const commit = () => {
        if (isChoice()) {
            props.toggleProf("choice", { options: optionsList().join(","), count: `${count()}` });
        } else {
            props.toggleProf(grantValue());
        }
    };

    return <div>
        <Show when={props.allowChoice}>
            <Checkbox
                label="Let the player choose the weapon(s)"
                checked={isChoice()}
                onChange={() => setIsChoice(v => !v)}
            />
        </Show>

        <Show when={!isChoice()}>
            <FormField name="Weapon Proficiency">
                <Select value={selected()} onChange={setSelected}>
                    <Option value={"Simple Weapons"}>Simple Weapons</Option>
                    <Option value={"Martial Weapons"}>Martial Weapons</Option>
                    <Option value={SPECIFIC}>A specific weapon…</Option>
                </Select>
            </FormField>

            <Show when={selected() === SPECIFIC}>
                <FormField name="Weapon Name">
                    <Input
                        value={specific()}
                        onInput={(e) => setSpecific(e.currentTarget.value)}
                        placeholder="e.g. Longswords"
                    />
                </FormField>
            </Show>
        </Show>

        <Show when={isChoice()}>
            <FormField name="Allowed weapons (comma-separated)">
                <Input
                    value={options()}
                    onInput={(e) => setOptions(e.currentTarget.value)}
                    placeholder="e.g. Longswords, Shortswords, Rapiers, Greataxes"
                />
            </FormField>

            <FormField name="How many the player picks">
                <Input value={count()} type="number" min={1} onChange={(e) => setCount(Math.max(1, +e.currentTarget.value || 1))} />
            </FormField>
        </Show>

        <Button disabled={isChoice() ? optionsList().length === 0 : !grantValue()} onClick={commit}>
            Set Change
        </Button>
    </div>
}

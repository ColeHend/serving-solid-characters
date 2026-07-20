import { Button, Checkbox, FormField, Input, Option, Select } from "coles-solid-library";
import { Accessor, Component, createMemo, createSignal, Show } from "solid-js";
import { WEAPON_CATEGORY_KEYS } from "../../../../../../shared/ai/commands/madCommandCatalog";
import { srdItem } from "../../../../../../models/data/generated";
import { ItemType } from "../../../../../../shared";
import { ItemMultiSelect } from "../itemMultiSelect/itemMultiSelect";

interface props {
    allItems: Accessor<srdItem[]>;
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
    const [options, setOptions] = createSignal<string[]>(
        (getMadValue("options") ?? "").split(",").map(s => s.trim()).filter(Boolean));
    const [count, setCount] = createSignal(+(getMadValue("count") ?? "1") || 1);

    const grantValue = createMemo(() => selected() === SPECIFIC ? specific().trim() : selected());

    const commit = () => {
        if (isChoice()) {
            props.toggleProf("choice", { options: options().join(","), count: `${count()}` });
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
            <ItemMultiSelect
                allItems={props.allItems}
                itemType={ItemType.Weapon}
                label="Allowed weapons"
                selected={options}
                onChange={setOptions}
            />

            <FormField name="How many the player picks">
                <Input value={count()} type="number" min={1} onChange={(e) => setCount(Math.max(1, +e.currentTarget.value || 1))} />
            </FormField>
        </Show>

        <Button disabled={isChoice() ? options().length === 0 : !grantValue()} onClick={commit}>
            Set Change
        </Button>
    </div>
}

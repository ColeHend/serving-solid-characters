import { Accessor, Component, For, createMemo, runWithOwner } from "solid-js";
import { FormField, Option, Select } from "coles-solid-library";
import { srdItem } from "../../../../../../models/data/generated";
import { ItemType } from "../../../../../../shared";

interface props {
    allItems: Accessor<srdItem[]>;
    itemType: ItemType;
    label: string;
    selected: Accessor<string[]>;
    onChange: (names: string[]) => void;
}

/**
 * Multi-select of catalog item names filtered by type (weapons, tools, …).
 * Names already selected but missing from the catalog (older free-text values,
 * deleted homebrew) are kept as options so they stay visible and removable.
 */
export const ItemMultiSelect: Component<props> = (props) => {
    const catalogNames = createMemo(() => {
        const names = new Set<string>();
        for (const item of props.allItems()) {
            if (item.type === props.itemType && item.name) names.add(item.name);
        }
        return [...names].sort((a, b) => a.localeCompare(b));
    });

    const optionNames = createMemo(() => {
        const catalog = catalogNames();
        const known = new Set(catalog);
        const selected = props.selected();
        const extras = Array.isArray(selected) ? selected.filter(name => !known.has(name)) : [];
        return [...catalog, ...extras];
    });

    // coles Select fires onChange from a tracked effect and, inside a FormField,
    // echoes the provider's value (seeded as "" — not an array). Drop non-array
    // echoes and unchanged values, or the value↔onChange loop tears down the popup.
    const handleChange = (value: string[]) => runWithOwner(null, () => {
        if (!Array.isArray(value)) return;
        const current = props.selected();
        if (value.length === current.length && value.every((name, i) => name === current[i])) return;
        props.onChange(value);
    });

    return <FormField name={props.label}>
        <Select value={props.selected()} onChange={handleChange} multiple>
            <For each={optionNames()}>
                {name => <Option value={name}>{name}</Option>}
            </For>
        </Select>
    </FormField>;
}

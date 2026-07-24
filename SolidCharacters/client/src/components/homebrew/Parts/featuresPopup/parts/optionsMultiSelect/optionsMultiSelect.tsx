import { Accessor, Component, For } from "solid-js";
import { FormField, Option, Select } from "coles-solid-library";

type OptionItem = string | { value: string; label: string };

interface props {
    label: string;
    options: readonly OptionItem[];
    selected: Accessor<string[]>;
    onChange: (values: string[]) => void;
    placeholder?: string;
}

const norm = (o: OptionItem) => (typeof o === "string" ? { value: o, label: o } : o);

/**
 * Multi-select of a curated option set (languages, skills, armor categories, …).
 * Options may be plain strings (value === label) or {value,label} pairs when the
 * stored value differs from the displayed name (e.g. "str" → "Strength").
 */
export const OptionsMultiSelect: Component<props> = (props) => (
    <FormField name={props.label}>
        <Select<string, true>
            multiple
            value={props.selected()}
            placeholder={props.placeholder}
            // 0.5.8 fixed the FormField onChange echo; keep only a cheap array
            // guard so a stray non-array emit can't corrupt the string[] signal.
            onChange={(values) => { if (Array.isArray(values)) props.onChange(values); }}
        >
            <For each={props.options}>
                {(o) => <Option value={norm(o).value}>{norm(o).label}</Option>}
            </For>
        </Select>
    </FormField>
);

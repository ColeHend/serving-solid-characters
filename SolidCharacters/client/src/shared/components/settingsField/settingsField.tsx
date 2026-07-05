import { Component, JSX, Show, splitProps } from "solid-js";
import { FormField } from "coles-solid-library";
import styles from "./settingsField.module.scss";

interface SettingsFieldProps {
    /** Floating-label legend text (the pill's label). */
    label: string;
    /** The control to wrap — a coles `Select`, `Input`, etc. */
    children: JSX.Element;
    /** Muted help text under the control. Use for example values — placeholders are hidden inside a FormField. */
    hint?: JSX.Element;
    /** Appends " *" to the label (the FormField required marker needs a formName, which the standalone pattern omits). */
    required?: boolean;
    class?: string;
}

/**
 * Floating-label "pill" field for the Settings modal. Wraps one control in a coles `FormField`
 * (pill fill, floating legend, focus behaviour) + full-width layout + an optional muted hint,
 * replacing the ad-hoc `<div><label/>…<div style="opacity:.6">` markup the AI tabs use today.
 *
 * Note: coles `FormField` hides the wrapped control's `placeholder` — put example text in `hint`.
 * When wrapping a `Select`, use `onChange` (not `onSelect`): inside a FormField `onSelect` never
 * fires on a click, and `onChange` also echoes from a tracked effect, so guard store writes
 * (equality check + `runWithOwner(null)`) — see the AI tabs for the pattern.
 */
export const SettingsField: Component<SettingsFieldProps> = (props) => {
    const [local] = splitProps(props, ["label", "children", "hint", "required", "class"]);

    return (
        <div class={`${styles.field} ${local.class ?? ""}`}>
            <FormField name={local.required ? `${local.label} *` : local.label} variant="standard">
                {local.children}
            </FormField>
            <Show when={local.hint !== undefined}>
                <div class={styles.hint}>{local.hint}</div>
            </Show>
        </div>
    );
};

export default SettingsField;

import { Accessor, Component, Show, createMemo } from "solid-js";
import { Input, TextArea } from "coles-solid-library";
import { MACHINE_CATEGORIES } from "./featuresPopup.shared";
import styles from "./featuresPopup.module.scss";

interface DetailsTabProps {
    name: Accessor<string>;
    category: Accessor<string>;
    description: Accessor<string>;
    onName: (value: string) => void;
    onCategory: (value: string) => void;
    onDescription: (value: string) => void;
}

export const DetailsTab: Component<DetailsTabProps> = (props) => {
    // ASI/Subclass are wizard machine tags the level table keys off — show, never edit.
    const locked = createMemo(() => MACHINE_CATEGORIES.includes(props.category()));

    return (
        <div>
            <label class={styles.label}>Name</label>
            <div class={styles.underlineField}>
                <Input
                    transparent
                    value={props.name()}
                    onInput={(e) => props.onName(e.currentTarget.value)}
                    placeholder="e.g. Darkvision, Second Wind, Spellcasting..."
                />
            </div>

            <label class={styles.label}>Category</label>
            <div class={styles.underlineField}>
                <Input
                    transparent
                    value={props.category()}
                    disabled={locked()}
                    onInput={(e) => props.onCategory(e.currentTarget.value)}
                    placeholder="e.g. Channel Divinity"
                />
            </div>
            <Show when={locked()}>
                <div class={styles.lockHint}>This category is managed by the level table and can't be edited.</div>
            </Show>

            <label class={styles.label}>Description</label>
            <div class={styles.underlineField}>
                <TextArea
                    transparent
                    text={props.description}
                    setText={(v) => props.onDescription(v.toString())}
                    placeholder="Describe what this feature does."
                />
            </div>
        </div>
    );
};

import { Accessor, Component, For, Show, createMemo, createSignal } from "solid-js";
import { Button, Checkbox, Chip, FormField, Input } from "coles-solid-library";
import { srdItem } from "../../../../../../models/data/generated";
import { ItemType } from "../../../../../../shared";
import { ItemPickerPanel } from "./itemPickerPanel";
import styles from './itemFeature.module.scss';

interface ItemFeatureProps {
    allItems: Accessor<srdItem[]>;
    getValue: Accessor<Record<string, string> | undefined>;
    /** Enables the "player chooses from a list" form (AddItems only). */
    allowChoice?: boolean;
    commit: (value: Record<string, string>) => void;
}

/**
 * Value editor for AddItems/RemoveItems. Specific mode picks one item ({ID}); choice mode
 * (AddItems only) builds the allowed list the player later picks from
 * ({ID:"choice", options:<CSV of item ids>, count}).
 */
export const ItemFeature: Component<ItemFeatureProps> = (props) => {
    const madValue = createMemo(() => props.getValue());
    const getMadValue = (key: string) => madValue()?.[key] ?? "";

    const storedId = getMadValue("ID");
    const [isChoice, setIsChoice] = createSignal(storedId === "choice");
    const [localID, setLocalID] = createSignal(storedId === "choice" ? "" : storedId);
    const [options, setOptions] = createSignal<string[]>(
        getMadValue("options").split(",").map(s => s.trim()).filter(Boolean));
    const [count, setCount] = createSignal(+(getMadValue("count") || "1") || 1);

    const itemById = (id: string) => props.allItems().find(item => item.id === id);
    const itemName = (id: string) => itemById(id)?.name ?? id;

    const selected = createMemo(() => itemById(localID()));
    const selectedProperties = createMemo(() => selected()?.properties ?? {});

    const addOption = (id: string) => setOptions(old => old.includes(id) ? old : [...old, id]);
    const removeOption = (id: string) => setOptions(old => old.filter(o => o !== id));

    const commit = () => {
        if (isChoice()) {
            props.commit({ "ID": "choice", "options": options().join(","), "count": `${count()}` });
        } else {
            props.commit({ "ID": localID() });
        }
    };

    return <div class={styles.itemFeature}>
        <Show when={props.allowChoice}>
            <Checkbox
                label="Let the player choose from a list"
                checked={isChoice()}
                onChange={() => setIsChoice(v => !v)}
            />
        </Show>

        <Show when={!isChoice()}>
            <div class={styles.pickerSplit}>
                <ItemPickerPanel
                    allItems={props.allItems}
                    onAdd={(id) => setLocalID(prev => prev === id ? "" : id)}
                />
                <Show when={selected()} fallback={<span class={styles.pickerHint}>Choose an item to see its details</span>}>
                    <div class={styles.detailPane}>
                        <h3>Selected Item: {selected()?.name}</h3>
                        <p><strong>Type:</strong> {ItemType[selected()?.type ?? 0]}</p>
                        <strong>Properties:</strong>
                        <ul class={styles.propertiesList}>
                            <For each={Object.keys(selectedProperties())}>
                                {key => <li>{key}: {selectedProperties()[key]}</li>}
                            </For>
                        </ul>
                        <p><strong>Weight:</strong> {selected()?.weight}</p>
                        <p><strong>Cost:</strong> {selected()?.cost}</p>
                        <p>{selected()?.desc}</p>
                    </div>
                </Show>
            </div>
        </Show>

        <Show when={isChoice()}>
            <div class={styles.chosenRow}>
                <Show when={options().length} fallback={<span class={styles.pickerHint}>Add the items the player may choose from</span>}>
                    <For each={options()}>
                        {(id) => <Chip value={itemName(id)} remove={() => removeOption(id)} />}
                    </For>
                </Show>
            </div>
            <ItemPickerPanel
                allItems={props.allItems}
                onAdd={addOption}
                excludeIds={options}
            />
            <FormField name="How many the player picks">
                <Input
                    value={count()}
                    type="number"
                    min={1}
                    onChange={(e) => setCount(Math.max(1, +e.currentTarget.value || 1))}
                />
            </FormField>
        </Show>

        <Button disabled={isChoice() ? options().length === 0 : !localID()} onClick={commit}>
            Set Change
        </Button>
    </div>;
};

import { Chip, FormField, Input, Select, Option } from "coles-solid-library";
import { Accessor, Component, createMemo, createSignal, For, Setter, Show } from "solid-js";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";
import { srdItem } from "../../../../../../models/data/generated";
import styles from "../../Background.module.scss";

interface SectionProps { 
    startItemKeys: Accessor<string[]>;
    startingEquipment: [Accessor<Record<string, string>>,Setter<Record<string, string>>];
    allItems: Accessor<srdItem[]>;
}

export const Equipment: Component<SectionProps> = (props) => {

    const startItemKeys = createMemo(() => props.startItemKeys());
    const [startingEquipment, setStartingEquipment]  = props.startingEquipment;
    const allItems = createMemo(() => props.allItems());

    const [itemChoiceKey, setItemChoiceKey] = createSignal("");
    const [itemChoices, setItemChoices] = createSignal<string[]>([]);

    return <FlatCard headerName="Equipment" icon="home_repair_service" transparent>
        {/* <div class={`${styles.equipmentSelectBox}`}>
            <FormField name="Option Key" formName="itemOptionKey">
                <Input value={itemChoiceKey()} onInput={(e) => setItemChoiceKey(e.currentTarget.value)} />
            </FormField>

            <FormField name="Add A Item" formName="itemSelect">
                <Select multiple>
                    <For each={allItems()}>
                        {item => <Option value={item.name}>{item.name}</Option>}
                    </For>
                </Select>
            </FormField>
        </div>


        <hr /> */}

        <Show when={startItemKeys().length > 0} fallback={<Chip value="None" />}>
            <For each={startItemKeys()}>
                {(key) => <>
                    {key}: {startingEquipment()[key]}
                </>}
            </For>
        </Show>
    </FlatCard>
}
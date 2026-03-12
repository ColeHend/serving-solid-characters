import { Chip, FormField, Input, Select, Option, Button } from "coles-solid-library";
import { Accessor, Component, createMemo, createSignal, For, Setter, Show } from "solid-js";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";
import { srdItem } from "../../../../../../models/data/generated";
import styles from "../../Background.module.scss";

interface SectionProps { 
    startItemKeys: Accessor<string[]>;
    startingEquipment: [Accessor<Record<string, string>>,Setter<Record<string, string>>];
    allItems: Accessor<srdItem[]>;
    setShowItems: Setter<boolean>;
}

export const Equipment: Component<SectionProps> = (props) => {

    const startItemKeys = createMemo(() => props.startItemKeys());
    const [startingEquipment]  = props.startingEquipment;

    return <FlatCard 
        headerName={<div class={`${styles}`}>
        <span>Equipment</span>
        </div>} 
        extraHeaderJsx={<Button onClick={()=>props.setShowItems(old => !old)}>Edit</Button>} 
        icon="home_repair_service" 
        transparent>
            <Show when={startItemKeys().length > 0} fallback={<Chip value="None" />}>
                <For each={startItemKeys()}>
                    {(key) => <Chip key={key} value={startingEquipment()[key]} />}
                </For>
            </Show>
    </FlatCard>
}
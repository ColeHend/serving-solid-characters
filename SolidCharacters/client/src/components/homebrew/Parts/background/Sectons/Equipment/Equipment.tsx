import { Chip } from "coles-solid-library";
import { Accessor, Component, createMemo, For, Show } from "solid-js";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";

interface SectionProps { 
    startItemKeys: Accessor<string[]>;
    startingEquipment: Accessor<Record<string, string>>;
}

export const Equipment: Component<SectionProps> = (props) => {

    const startItemKeys = createMemo(() => props.startItemKeys());
    const startingEquipment = createMemo(() => props.startingEquipment());

    return <FlatCard headerName="Equipment" icon="home_repair_service" transparent>
        <Show when={startItemKeys().length > 0} fallback={<Chip value="None" />}>
            <For each={startItemKeys()}>
                {(key) => <>
                    {key}: {startingEquipment()[key]}
                </>}
            </For>
        </Show>
    </FlatCard>
}
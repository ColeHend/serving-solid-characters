import { Accessor, Component, For, Setter, Show } from "solid-js";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";
import { FeatureDetail } from "../../../../../../models/generated";
import { Button, Chip } from "coles-solid-library";

interface SectonProps {
    features: [Accessor<FeatureDetail[]> ,Setter<FeatureDetail[]>];
    showPopup: Setter<boolean>;
}

export const OptionalFeatures:Component<SectonProps> = (props) => {

    const [features,] = props.features;
    
    return <FlatCard headerName="Optional Features" extraHeaderJsx={<Button onClick={()=>props.showPopup(old => !old)}>Edit</Button>} icon="star" transparent>
        <Show when={features().length > 0} fallback={<Chip value="None" />}>
            <div>
                <For each={features()}>
                    {feature => <Chip value={feature.name} />}
                </For>
            </div>
        </Show>
    </FlatCard>
} 
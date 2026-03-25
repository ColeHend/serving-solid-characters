import { Accessor, Component, For, Setter, Show } from "solid-js";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";
import { FeatureDetail } from "../../../../../../models/generated";
import { Button, Chip } from "coles-solid-library";

interface SectonProps {
    features: [Accessor<FeatureDetail[]> ,Setter<FeatureDetail[]>];
    showPopup: Setter<boolean>;
    currentFeature: [Accessor<FeatureDetail|undefined>, Setter<FeatureDetail|undefined>];
}

export const OptionalFeatures:Component<SectonProps> = (props) => {

    const [features, setFeatures] = props.features;

    const [currentFeature, setCurrentFeature] = props.currentFeature;

    const handleFeatureClick = (feature: FeatureDetail) => {
        setCurrentFeature(feature);
        props.showPopup(true);
    }
    
    return <FlatCard headerName="Optional Features" extraHeaderJsx={<Button onClick={()=>props.showPopup(old => !old)}>Add Feature</Button>} icon="star" transparent>
        <Show when={features().length > 0} fallback={<Chip value="None" />}>
            <div>
                <For each={features()}>
                    {feature => <Chip value={feature.name} onClick={(e) => {
                        e.stopPropagation();
                        handleFeatureClick(feature);
                    }} remove={(e)=>{
                        e.stopPropagation();
                        setFeatures(features().filter(f => f.name.trim().toLowerCase() !== feature.name.trim().toLowerCase()))
                    }} />}
                </For>
            </div>
        </Show>
    </FlatCard>
} 
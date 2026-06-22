import { Accessor, Component, For, Setter, Show } from "solid-js";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";
import { FeatureDetail } from "../../../../../../models/generated";
import { Button, Chip } from "coles-solid-library";
import { Star } from "coles-solid-library/icons";

interface SectonProps {
    features: [Accessor<FeatureDetail[]> ,Setter<FeatureDetail[]>];
    showPopup: Setter<boolean>;
    currentFeature: [Accessor<FeatureDetail>, Setter<FeatureDetail>];
    setIsEdit: Setter<boolean>;
}

export const OptionalFeatures:Component<SectonProps> = (props) => {

    const [features, setFeatures] = props.features;

    const [currentFeature, setCurrentFeature] = props.currentFeature;

    const handleFeatureClick = (feature: FeatureDetail) => {
        setCurrentFeature(feature);
        
        const isEdit = handleFeatureEdit();

        if (!isEdit) {

            setCurrentFeature({
                id: "",
                name: "",
                description: "",
                metadata: {}
            })

        }

        props.showPopup(true);
    }

    /**
     * 
     * @returns Will set is `isEdit` to `true` if feature exists or `false` if it doesn't;
     */
    const handleFeatureEdit = () => {
        const current = currentFeature();
        const all = features();

        if (!current) {
            return;
        }

        if (all.some(x => x.name.trim().toLowerCase() === current.name.trim().toLowerCase())) {
            props.setIsEdit(true);
            return true;
        }

        props.setIsEdit(false);
        return false;
    }
    
    return <FlatCard headerName="Optional Features" extraHeaderJsx={<Button onClick={()=>props.showPopup(old => !old)}>Edit</Button>} icon={Star} transparent>
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
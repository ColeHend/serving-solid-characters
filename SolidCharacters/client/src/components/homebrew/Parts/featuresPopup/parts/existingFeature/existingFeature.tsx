import { Accessor, Component } from "solid-js";
import { FeatureDetail } from "../../../../../../shared";

interface props {
    toggleFeature: (featureName: string) => void;
    allFeatures: Accessor<FeatureDetail[]>;
}

export const ExistingFeature: Component<props> = (props) => {

    return <div>

    </div>
} 
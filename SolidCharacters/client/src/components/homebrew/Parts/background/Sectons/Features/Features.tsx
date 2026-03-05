import { Component } from "solid-js";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";

interface SectonProps {

}

export const OptionalFeatures:Component<SectonProps> = (props) => {
    
    return <FlatCard headerName="Optional Features" icon="star" transparent>
        Features
    </FlatCard>
} 
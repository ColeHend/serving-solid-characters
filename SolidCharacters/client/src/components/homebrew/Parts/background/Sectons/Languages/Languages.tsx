import { Component } from "solid-js";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";

interface SectionProps {
    
}

export const Languages: Component<SectionProps> = (props) => {



    return <FlatCard headerName="Languages" icon="chat" transparent>
        Languages
    </FlatCard>
}
import { Button } from "coles-solid-library";
import { Component } from "solid-js";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";

interface SectonProps {

}

export const Saving: Component<SectonProps> = (props) => {

    return <FlatCard headerName="saving" icon="save" alwaysOpen transparent>
        <Button>Save</Button>
    </FlatCard>
}
import { Button } from "coles-solid-library";
import { Accessor, Component, createMemo, Show } from "solid-js";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";

type event = MouseEvent & {
    currentTarget: HTMLButtonElement;
    target: Element;
}

interface SectonProps {
    is_exist: Accessor<boolean>;
}

export const Saving: Component<SectonProps> = (props) => {
    const is_exist = createMemo(() => props.is_exist());

    return <FlatCard headerName="saving" icon="save" alwaysOpen transparent>
        <Button>{is_exist() ? "Edit" : "Create"}</Button>
    </FlatCard>
}
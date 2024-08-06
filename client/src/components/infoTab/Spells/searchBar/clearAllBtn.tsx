import { Component, For } from "solid-js";
import useStyle from "../../../../shared/customHooks/utility/style/styleHook";
import { Button } from "../../../../shared/components";

type Props = {
    clear: () => void;
}

const ClearAllBtn: Component<Props> = (props) => {
    const stylin = useStyle();

    return (
        <Button class={`${stylin.accent}`} onClick={props.clear}>Clear All</Button>
    );
}
export default ClearAllBtn;
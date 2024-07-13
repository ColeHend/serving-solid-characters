import { Component, For } from "solid-js";
import useStyle from "../../../../shared/customHooks/utility/style/styleHook";

type Props = {
    clear: () => void;
}

const ClearAllBtn: Component<Props> = (props) => {
    const stylin = useStyle();

    return (
        <button class={`${stylin.accent}`} onClick={props.clear}>Clear All</button>
    );
}
export default ClearAllBtn;
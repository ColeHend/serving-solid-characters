import { Component } from "solid-js";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";

const View: Component = () => {
    const stylin = useStyle();     
    return (
        <div class={`${stylin.accent}`}>
            <h1>View</h1>
        </div>
    );
}
export default View;
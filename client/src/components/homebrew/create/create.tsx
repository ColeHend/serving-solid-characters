import { Component } from "solid-js";
import useStyle from "../../../customHooks/utility/style/styleHook";

const Create: Component = () => {
    const stylin = useStyle();     
    return (
        <div class={`${stylin.accent}`}>
            <h1>Create</h1>
        </div>
    );
}
export default Create;
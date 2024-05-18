import { Component } from "solid-js";
import useStyle from "../../customHooks/utility/style/styleHook";

const Homebrew: Component = () => {
    const stylin = useStyle();     
    return (
        <div class={`${stylin.accent}`}>
            <h1>Homebrew</h1>
        </div>
    );
}
export default Homebrew;
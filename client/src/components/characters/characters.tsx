import { Component } from "solid-js";
import useStyle from "../../customHooks/utility/style/styleHook";
import styles from "./characters.module.scss";

const Characters: Component = () => {
    const stylin = useStyle();

    return (
        <div class={`${stylin.accent} ${styles.mainBody}`}>
            <h1>Characters</h1>
        </div>
    )
};

export default Characters;
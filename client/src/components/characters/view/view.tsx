import { Component } from "solid-js";
import useStyle from "../../../customHooks/utility/style/styleHook";
import styles from "./view.module.scss";

const CharacterView: Component = () => {
    const stylin = useStyle();
    return (
        <div class={`${stylin.accent} ${styles.mainBody}`}>
            <h1>Characters View</h1>
        </div>
    )
};

export default CharacterView;
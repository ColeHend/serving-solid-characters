import { Component } from "solid-js";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import styles from "./create.module.scss";

const CharacterCreate: Component = () => {
    const stylin = useStyle();
    return (
        <div class={`${stylin.accent} ${styles.mainBody}`}>
            <h1>Characters Create</h1>
        </div>
    )
};

export default CharacterCreate;
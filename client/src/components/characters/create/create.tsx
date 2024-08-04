import { Component, createMemo } from "solid-js";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import styles from "./create.module.scss";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";

const CharacterCreate: Component = () => {
    const [userSettings, setUserSettings] = getUserSettings();
  const stylin = createMemo(()=>useStyles(userSettings().theme));

    return (
        <div class={`${stylin().accent} ${styles.mainBody}`}>
            <h1>Characters Create</h1>
        </div>
    )
};

export default CharacterCreate;
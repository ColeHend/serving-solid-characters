import { Component, createMemo } from "solid-js";
import styles from "./create.module.scss";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";
import { Body } from "coles-solid-library";

const CharacterCreate: Component = () => {
  // eslint-disable-next-line
  const [userSettings, setUserSettings] = getUserSettings();
  const stylin = createMemo(()=>useStyles(userSettings().theme));

  return (
    <Body class={`${stylin().accent} ${styles.mainBody}`}>
      <h1>Characters Create</h1>
    </Body>
  )
};

export default CharacterCreate;
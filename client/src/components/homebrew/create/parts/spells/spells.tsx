import { Component, For, createSignal, useContext, createMemo } from "solid-js";
import useStyle from "../../../../../shared/customHooks/utility/style/styleHook";
import styles from './spells.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";
import { SharedHookContext } from "../../../../../rootApp";
import useStyles from "../../../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../../../shared/customHooks/userSettings";

const Spells: Component = () => {
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyles(userSettings().theme));
    return (
        <>
            <div class={`${stylin()?.primary} ${styles.body}`}>
                <h1>spells</h1>
                <p>name</p>
                <p>level</p>
                <p>school</p>
                <p>casting time</p>
                <p>range</p>
                <p>components</p>
                <p>duration</p>
                <p>description</p>
                <p>classes list</p>
            </div>
        </>
    );
}
export default Spells;
import { Component, For, createSignal, useContext, createMemo } from "solid-js";
import useStyle from "../../../../../shared/customHooks/utility/style/styleHook";
import styles from './races.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";
import { SharedHookContext } from "../../../../rootApp";
import useStyles from "../../../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../../../shared/customHooks/userSettings";

const Races: Component = () => {
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyles(userSettings().theme));
    return (
        <>
            <div class={`${stylin()?.primary} ${styles.body}`}>
                <h1>races</h1>
                <div>
                    <p>name</p>
                    <p>size</p>
                    <p>speed</p>
                    <p>ability score increase</p>
                    <p>age range</p>
                    <p>features</p>
                </div>
            </div>
        </>
    );
}
export default Races;
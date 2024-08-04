import { Component, For, createSignal, useContext, createMemo } from "solid-js";
import useStyle from "../../../../../shared/customHooks/utility/style/styleHook";
import styles from './backgrounds.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";
import { SharedHookContext } from "../../../../../rootApp";
import useStyles from "../../../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../../../shared/customHooks/userSettings";

const Backgrounds: Component = () => {
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyles(userSettings().theme));
    return (
        <>
            <div class={`${stylin()?.primary} ${styles.body}`}>
                <h1>backgrounds</h1>
                <div>
                    <p>ideals</p>
                    <p>bonds</p>
                    <p>flaws</p>
                    <p>personality traits</p>
                    <p>background features</p>
                    <p>languages</p>
                    <p>skills</p>
                    <p>tools</p>
                </div>
            </div>
        </>
    );
}
export default Backgrounds;
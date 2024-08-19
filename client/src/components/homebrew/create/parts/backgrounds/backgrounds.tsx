import { Component, For, createSignal, useContext, createMemo } from "solid-js";
import { useStyle, Body } from "../../../../../shared/";
import styles from './backgrounds.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";
import { SharedHookContext } from "../../../../rootApp";
import getUserSettings from "../../../../../shared/customHooks/userSettings";

const Backgrounds: Component = () => {
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyle(userSettings().theme));
    return (
        <>
            <Body>
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
            </Body>
        </>
    );
}
export default Backgrounds;
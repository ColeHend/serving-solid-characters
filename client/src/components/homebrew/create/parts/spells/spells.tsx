import { Component, For, createSignal, useContext, createMemo } from "solid-js";
import { useStyle, getUserSettings, Body } from "../../../../../shared/";
import styles from './spells.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";
import { SharedHookContext } from "../../../../rootApp";

const Spells: Component = () => {
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyle(userSettings().theme));
    return (
        <>
            <Body>
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
            </Body>
        </>
    );
}
export default Spells;
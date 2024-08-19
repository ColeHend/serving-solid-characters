import { Component, For, createSignal, useContext, createMemo } from "solid-js";
import { useStyle, getUserSettings, Body } from "../../../../../shared/";
import styles from './races.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";
import { SharedHookContext } from "../../../../rootApp";

const Races: Component = () => {
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyle(userSettings().theme));
    return (
        <>
            <Body>
                <h1>races</h1>
                <div>
                    <p>name</p>
                    <p>size</p>
                    <p>speed</p>
                    <p>ability score increase</p>
                    <p>age range</p>
                    <p>features</p>
                </div>
            </Body>
        </>
    );
}
export default Races;
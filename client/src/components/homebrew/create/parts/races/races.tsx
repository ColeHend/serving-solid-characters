import { Component, For, createSignal } from "solid-js";
import useStyle from "../../../../../shared/customHooks/utility/style/styleHook";
import styles from './races.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";

const Races: Component = () => {
    const stylin = useStyle();
    return (
        <>
            <HomebrewSidebar />
            <div class={`${stylin.accent} ${styles.body}`}>
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
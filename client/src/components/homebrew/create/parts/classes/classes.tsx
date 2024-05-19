import { Component, For, createSignal } from "solid-js";
import useStyle from "../../../../../customHooks/utility/style/styleHook";
import styles from './classes.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";

const Classes: Component = () => {
    const stylin = useStyle();
    return (
        <>
            <HomebrewSidebar />
            <div class={`${stylin.accent} ${styles.body}`}>
                <h1>classes</h1>
            </div>
        </>
    );
}
export default Classes;
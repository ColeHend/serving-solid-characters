import { Component, For, createSignal } from "solid-js";
import useStyle from "../../../../../customHooks/utility/style/styleHook";
import styles from './items.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";

const Items: Component = () => {
    const stylin = useStyle();
    return (
        <>
            <HomebrewSidebar />
            <div class={`${stylin.accent} ${styles.body}`}>
                <h1>items</h1>
            </div>
        </>
    );
}
export default Items;
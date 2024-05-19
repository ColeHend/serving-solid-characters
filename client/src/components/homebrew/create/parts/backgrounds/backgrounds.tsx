import { Component, For, createSignal } from "solid-js";
import useStyle from "../../../../../customHooks/utility/style/styleHook";
import styles from './backgrounds.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";

const Backgrounds: Component = () => {
    const stylin = useStyle();
    return (
        <>
            <HomebrewSidebar />
            <div class={`${stylin.accent} ${styles.body}`}>
                <h1>backgrounds</h1>
            </div>
        </>
    );
}
export default Backgrounds;
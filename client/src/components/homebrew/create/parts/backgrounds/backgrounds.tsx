import { Component, For, createSignal } from "solid-js";
import useStyle from "../../../../../shared/customHooks/utility/style/styleHook";
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
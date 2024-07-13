import { Component, For, createSignal } from "solid-js";
import useStyle from "../../../../../shared/customHooks/utility/style/styleHook";
import styles from './subclasses.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";

const Subclasses: Component = () => {
    const stylin = useStyle();
    return (
        <>
            <HomebrewSidebar />
            <div class={`${stylin.accent} ${styles.body}`}>
                <h1>subclasses</h1>
                <div>
                    <p>Level up features</p>
                    <p>Potentially spellcasting</p>
                </div>
            </div>
        </>
    );
}
export default Subclasses;
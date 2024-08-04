import { Component, For, Show, createSignal, useContext } from "solid-js";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import styles from './create.module.scss';
import type { Tab } from "../../navbar/navbar";
import HomebrewSidebar from "./sidebar";
import { SharedHookContext } from "../../../rootApp";
const Create: Component = () => {
    const sharedHooks = useContext(SharedHookContext);
    const stylin = sharedHooks?.useStyle();
    const menu5E = [{name: "Classes"}, {name: "Races"}, {name: "Backgrounds"}, {name: "Feats"}, {name: "Spells"}, {name: "Items"}];
    const [ homebrewMenu, setHombrewMenu ] = createSignal<{name: string}[]>(menu5E);

    return (
        <>
            <div class={`${stylin?.primary} ${styles.body}`}>
                <h1>Create</h1>
                <div class={`${styles.bodyMenu} `}>
                    <For each={homebrewMenu()}>
                        {(menu, i) => (
                            <>
                                    <a class={`${stylin?.primary}`} href={`/homebrew/create/${menu.name.toLowerCase()}`}>
                                        <div class={`${stylin?.hover}`}>
                                            <p>
                                                {menu.name}
                                            </p>
                                        </div>
                                    </a>
                                <Show when={i() === 2}>
                                    <div style={{height: 0, "flex-basis": "100%"}}></div>
                                </Show>
                            </>
                        )}
                    </For>
                </div>
            </div>
        </>
    );
}
export default Create;
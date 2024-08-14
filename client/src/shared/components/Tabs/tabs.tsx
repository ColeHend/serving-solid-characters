import { Accessor, children, Component, createContext, createMemo, createSignal, For, JSX, onMount, Setter, Show, useContext } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";
import { Dynamic, effect } from "solid-js/web";
import exp from "constants";
import { ProviderProps } from "../../../models/hookContext";
import { Tab } from "./tab";
import { getUserSettings, useStyle } from "../..";
import style from "./tabs.module.scss";

interface TabStore {
    [name: string]: JSX.Element;
}

export const tabContext = createContext<[Accessor<TabStore>, Setter<TabStore>]>(createSignal<TabStore>({}));
const Provider: Component<ProviderProps<[Accessor<TabStore>, Setter<TabStore>]>> = (props) => {
    return <tabContext.Provider value={props.value}>{props.children}</tabContext.Provider>
}

interface Props {
    children: JSX.Element;
    styleType?: "primary" | "accent" | "tertiary";
}
const Tabs: Component<Props> = (props) => {
    const [defaultUserSettings, setDefaultUserSettings] = getUserSettings();
    const userStyle = createMemo(()=>useStyle(defaultUserSettings().theme));
    const [tabs, setTabs] = useContext(tabContext);
    const [selectedTab, setSelectedTab] = createSignal(Object.keys(tabs())[0]);
    const currentElement = createMemo(() => tabs()[selectedTab()]);
    const currentChildren = children(()=> props.children);
    effect(()=>{
        setSelectedTab(Object.keys(tabs())[0]);
        
    })
    const styleType = props.styleType ?? "accent";
    return (
        <div>
            <Provider value={[tabs, setTabs]}>
                <div class={`${userStyle()[styleType]} ${style.tabs}`}>
                    <For each={Object.keys(tabs())}>
                        {(tab, index) => (
                            <span class={`${useStyle().hover}`} onClick={() => setSelectedTab(tab)}>
                                <Show when={tab === selectedTab()}><b>{tab}</b></Show>
                                <Show when={tab !== selectedTab()}>{tab}</Show>
                            </span>
                        )}
                    </For>
                </div>
                <div class={`${userStyle()[styleType]} ${style.tabBody}`}>
                    {currentElement()}
                </div>
            </Provider>
        </div>
    );
};


export {Tab, Tabs };
export default Tabs;
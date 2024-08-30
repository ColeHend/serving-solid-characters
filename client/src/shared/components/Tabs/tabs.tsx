import { Accessor, children, Component, createContext, createMemo, createSignal, For, JSX, onCleanup, onMount, Setter, Show, useContext } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";
import { Dynamic, effect } from "solid-js/web";
import exp from "constants";
import { ProviderProps } from "../../../models/hookContext";
import { Tab } from "./tab";
import { Button, getUserSettings, useStyle } from "../..";
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
        
    });
		const [showLeft, setShowLeft] = createSignal(false);
    const [showRight, setShowRight] = createSignal(false);
    const scrollFunction = (e: any) => {
        setShowRight(tabContainer?.scrollLeft !== tabContainer?.scrollWidth - tabContainer?.clientWidth);
        setShowLeft(tabContainer?.scrollLeft > 0);
        if (tabContainer?.scrollLeft <= 0) {
            setShowLeft(false);
        }
    }
		let tabContainer: HTMLDivElement;
		effect(()=>{
			console.log("showLeft", showLeft());
			console.log("showRight", showRight());
		})
		onMount(()=>{
			if (!!tabContainer) {
				tabContainer.addEventListener("scroll", scrollFunction)
				scrollFunction(null);
			}
		});
		onCleanup(()=>{
				if (!!tabContainer) {
					tabContainer.removeEventListener("scroll", scrollFunction)
				}
		});
		const scrollLeft = () => {
			tabContainer.scrollLeft -= 100;
			scrollFunction(null);
		}
		const scrollRight = () => {
			tabContainer.scrollLeft += 100;
				scrollFunction(null);
				setShowLeft(true);
		}
    const styleType = props.styleType ?? "accent";
    return (
        <div>
            <Provider value={[tabs, setTabs]}>
                <div class={`${userStyle()[styleType]} ${style.tabs}`}>
										<Show when={showLeft()}>
												<span class={`${style.leftArrow}`}>
														<Button onClick={scrollLeft}>←</Button>
												</span>
										</Show>
                    <div ref={tabContainer!}>
											<For each={Object.keys(tabs())}>
													{(tab, index) => (
															<span class={`${useStyle().hover}`} onClick={() => setSelectedTab(tab)}>
																	<Show when={tab === selectedTab()}><b>{tab}</b></Show>
																	<Show when={tab !== selectedTab()}>{tab}</Show>
															</span>
													)}
											</For>
										</div>
										<Show when={showRight()}>
												<span class={`${style.rightArrow}`}>
														<Button onClick={scrollRight}>→</Button>
												</span>
										</Show>
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
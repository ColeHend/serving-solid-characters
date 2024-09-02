import { Accessor, children, Component, createContext, createMemo, createSignal, For, JSX, onCleanup, onMount, Setter, Show, useContext } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";
import { Dynamic, effect } from "solid-js/web";
import exp from "constants";
import { ProviderProps } from "../../../models/hookContext";
import { Tab } from "./tab";
import { Button, getUserSettings, useStyle } from "../..";
import style from "./tabs.module.scss";

interface ITabStore {
    [name: string]: JSX.Element;
}

const tabContext = createContext<{tabs: Accessor<ITabStore>, setTabs: Setter<ITabStore>}>({
	tabs: () => ({}), 
	setTabs: () => {}
});
export function getTabContext() {
		return useContext(tabContext);
}

interface ITabProvider {
		children: JSX.Element;
		value: ITabStore;
}
const TabProvider: Component<ITabProvider> = (props) => {
	const [tabs, setTabs] = createSignal<ITabStore>(props.value, {
		equals: (a, b)=>{
			const sameLength = Object.keys(a).length === Object.keys(b).length;
			if (!sameLength) return false;
			for (const key in a) {
				if (a[key] !== b[key]) return false;
			}
			if (JSON.stringify(a) !== JSON.stringify(b)) return false;
			return true
		}
	}); 
    return <tabContext.Provider value={{tabs, setTabs}}>{props.children}</tabContext.Provider>
}

const Tabs: Component<Props> = (props) => {
		return <TabProvider value={{}}><TabInternal {...props}/></TabProvider>
}

interface Props {
    children: JSX.Element;
    styleType?: "primary" | "accent" | "tertiary";
}
const TabInternal: Component<Props> = (props) => {
    const [defaultUserSettings, setDefaultUserSettings] = getUserSettings();
    const userStyle = createMemo(()=>useStyle(defaultUserSettings().theme));
    const {tabs, setTabs} = useContext<{tabs: Accessor<ITabStore>, setTabs: Setter<ITabStore>}>(tabContext);
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
			console.log("tabs: ", tabs());
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
        </div>
    );
};


export {Tab, Tabs };
export default Tabs;
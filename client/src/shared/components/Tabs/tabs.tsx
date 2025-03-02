import {
  Accessor,
  children,
  Component,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  For,
  JSX,
  onCleanup,
  onMount,
  Setter,
  Show,
  useContext,
} from "solid-js";
import { Dynamic, effect } from "solid-js/web";
import { Tab } from "./tab";
import { Button, getUserSettings, Style, useStyle } from "../..";
import style from "./tabs.module.scss";

interface ITabStore {
  [name: string]: JSX.Element;
}

const tabContext = createContext<{
  tabs: Accessor<ITabStore>;
  setTabs: Setter<ITabStore>;
}>({
  tabs: () => ({}),
  setTabs: () => {},
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
		transparent?: boolean;
}
const TabInternal: Component<Props> = (props) => {
    const [defaultUserSettings, setDefaultUserSettings] = getUserSettings();
	let userStyle: Accessor<Style> = ()=>({} as Style);
	if (typeof useStyle === 'function') {
		userStyle = createMemo(()=>useStyle(defaultUserSettings()?.theme));
	}
    const {tabs, setTabs} = useContext<{tabs: Accessor<ITabStore>, setTabs: Setter<ITabStore>}>(tabContext);
    const [selectedTab, setSelectedTab] = createSignal(Object.keys(tabs())[0]);
    const currentElement = createMemo(() => tabs()[selectedTab()]);
    const currentChildren = children(()=> props.children);
		const isMobile = createMemo(()=>window.innerWidth < 768);
		const hasTranparent = createMemo(()=>Object.keys(props).includes("transparent"));
    effect(()=>{
        setSelectedTab(Object.keys(tabs())[0]);
        
    });
		const [showLeft, setShowLeft] = createSignal(false);
    const [showRight, setShowRight] = createSignal(false);
    const scrollFunction = (e: any) => {
			const scrollLeft = tabContainer?.scrollLeft;
			const scrollRight = tabContainer?.offsetWidth;
			const scrollWidth = tabContainer?.scrollWidth ?? 0;
			const clientWidth = tabContainer?.clientWidth ?? 0;
			const newWidth = scrollWidth - clientWidth;

			const showRight = (Object.keys(tabs()).length >= 3 && isMobile()) || scrollLeft !== newWidth;
			const showLeft = scrollLeft > 0;
			
			setShowRight(showRight);
			setShowLeft(showLeft);
			if (scrollLeft <= 0) {
					setShowLeft(false);
			}
    }
		let tabContainer: HTMLDivElement;
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
		const [tabsArr, setTabsArr] = createSignal(Object.keys(tabs()));
		createEffect(()=>{
			setTabsArr(Object.keys(tabs()));
		});
    return (
        <div class={`${style.tabs}`}>
            <div  class={`${userStyle()[styleType]} ${style.singleTabs} ${hasTranparent() === true ? style.transparent : ""}`}>
							<Show when={showLeft()}>
									<span class={`${style.leftArrow}`}>
											<Button onClick={scrollLeft}>←</Button>
									</span>
							</Show>
							<div ref={tabContainer!} class={`${style.tabHeader}`}>
								<For each={tabsArr()}>
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
						<div class={`${userStyle()[styleType]} ${style.tabBody} ${hasTranparent() === true ? style.transparent : ""}`}>
								{currentElement()}
						</div>
        </div>
    );
};



export { Tab, Tabs };
export default Tabs;

import { Accessor, Component, For, JSX, Show, Signal, createSignal, onMount, onCleanup, Setter } from "solid-js";
import navStyles from './navbar.module.scss';
import useStyle from "../../customHooks/utility/style/styleHook";
import useTabs from "../../customHooks/utility/tabBar";
import { Portal, effect } from "solid-js/web";
import { A } from "@solidjs/router";
import Modal from "../shared/popup/popup.component";
import NavMenu from "./navMenu/navMenu";

type Props = {
    style: CSSModuleClasses[string],
    siteName?: string,
    links?: Tab[]
    list: [Accessor<boolean>, Setter<boolean>];

};

export interface Tab {
    Name: string;
    Link: string;
}

const Navbar: Component<Props> = (props) => {
    const stylin = useStyle(); 
    const refresh = createSignal(false);
    const [pageName, setPageName] = createSignal(window.location.pathname);
    const Buttons: Tab[] = [
        {Name: "Home", Link: "/"},
        {Name: "Characters", Link: "/characters"},
        {Name: "Info", Link: "/info"},
        {Name: "Homebrew", Link: "/homebrew"}
    ];
    let tabs = useTabs(pageName);
    const [showList, setShowList] = props.list;
    
    const [showFullList, setShowFullList] = createSignal(false);
    effect(()=>{
        setShowFullList(!showList());
    })
    return (
        <div class={navStyles.navbar}>
            <div style={showList() ? {margin: "0 auto", width: "100%"} :{}} class={`${props.style}`}>
                <Show when={!showList()}>
                        <span>
                            MySite
                        </span>
                </Show>
                <ul style={showList() ? {margin: "0 auto", width: "min-content"} :{}}>
                        <Show when={showList()}>
                            <li >
                                <div>
                                    MySite
                                </div>
                            </li> 
                        </Show>
                    <For each={Buttons}>
                        {(button, i) => (
                                <Show when={!showList() || i() === 0 || showFullList()}>
                                    <li class={`${stylin.hover} ${(pageName() === '/' && button.Link === '/') || (pageName().startsWith(button.Link) && pageName() !== '/' && button.Link !== '/') ? navStyles.active : navStyles.inactive}`}>
                                        <A onClick={()=>setPageName(button.Link)} href={button.Link}>{button.Name}</A>
                                        <Show when={showList() && i() === 0}>
                                                <button style={{background: "none", color: "white", "font-size": '1.5rem', "padding": "0 10px", width: 'min-content', "margin-right": '0'}} onClick={()=>setShowFullList(!showFullList())}>{showFullList() ? "↑": "↓" }</button>
                                        </Show>
                                    </li>
                                </Show>
                        )}
                    </For>
                </ul>
                <NavMenu></NavMenu>
            </div>
            <Show when={tabs().length > 0}>
                <div class={props.style}>
                    <ul>
                        <For each={tabs()}>
                            {(tab) => (
                                    <li class={`${stylin.hover} ${pageName() === tab.Link ? navStyles.active : navStyles.inactive}`}>
                                        <A onClick={()=>setPageName(tab.Link)} href={tab.Link}>{tab.Name}</A>
                                    </li>
                            )}
                        </For>
                    </ul>
                </div>
            </Show>
        </div>
    )
}
export default Navbar;
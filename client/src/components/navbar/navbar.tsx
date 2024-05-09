import { Accessor, Component, For, JSX, Show, Signal, createSignal } from "solid-js";
import navStyles from './navbar.module.scss';
import useStyle from "../../customHooks/utility/style/styleHook";
import useTabs from "../../customHooks/utility/tabBar";
import { Portal, effect } from "solid-js/web";
import { A } from "@solidjs/router";
import Modal from "../popup/popup.component";
import NavMenu from "./navMenu/navMenu";

type Props = {
    style: CSSModuleClasses[string],
    siteName?: string,
    links?: Tab[]

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
    
    return (
        <div class={navStyles.navbar}>
            <div class={`${props.style}`}>
                <span>
                    MySite
                </span>
                <ul>
                    <For each={Buttons}>
                        {(button) => (
                            <li class={`${stylin.hover} ${(pageName() === '/' && button.Link === '/') || (pageName().startsWith(button.Link) && pageName() !== '/' && button.Link !== '/') ? navStyles.active : navStyles.inactive}`}>
                                <A onClick={()=>setPageName(button.Link)} href={button.Link}>{button.Name}</A>
                            </li>
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
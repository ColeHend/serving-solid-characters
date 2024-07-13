import { Accessor, Component, For, JSX, Show, Signal, createSignal, onMount, onCleanup, Setter } from "solid-js";
import navStyles from './navbar.module.scss';
import useStyle from "../../shared/customHooks/utility/style/styleHook";
import useTabs from "../../shared/customHooks/utility/tabBar";
import { Portal, effect } from "solid-js/web";
import { A } from "@solidjs/router";
import Modal from "../../shared/components/popup/popup.component";
import NavMenu from "./navMenu/navMenu";
import Button, { MenuButton } from "../../shared/components/Button/Button";

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
    const [loggedIn, setLoggedIn] = createSignal(false);
    const [pageName, setPageName] = createSignal(window.location.pathname);
    const Buttons: Tab[] = [
        {Name: "Home", Link: "/"},
        {Name: "Characters", Link: "/characters"},
        {Name: "Info", Link: "/info"},
        {Name: "Homebrew", Link: "/homebrew"}
    ];
    const menuButtons: MenuButton[] = [
        {
            name: "Login",
            condition: ()=>!loggedIn(),
            action: ()=>{setLoggedIn(true)}
        },
        {
            name: "Register",
            condition: ()=>!loggedIn(),
            action: ()=>{}
        },
        {
            name: "Logout",
            condition: loggedIn,
            action: ()=>{setLoggedIn(false)}
        },
        {
            name: "Profile",
            condition: loggedIn,
            action: ()=>{}
        },
        {
            name: "Settings",
            condition: ()=>true,
            action: ()=>{}
        }
    ]
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
                <Button menuItems={menuButtons} overrideX="93vw" overrideY="8vh">
                    <svg width="32pt" height="32pt" version="1.1" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
                        <path d="m113.15 40.062c4.9922 0 8.5742-3.5859 8.5742-8.4492s-3.5859-8.7031-8.5742-8.7031h-98.176c-4.8633 0-8.7031 3.8398-8.7031 8.7031s3.8398 8.4492 8.7031 8.4492zm-98.176 47.875c-4.8633 0-8.7031 3.8398-8.7031 8.5742s3.8398 8.7031 8.7031 8.7031h98.305c4.9922 0 8.5742-3.9688 8.5742-8.7031s-3.5859-8.5742-8.5742-8.5742zm0-32.641c-4.8633 0-8.7031 3.8398-8.7031 8.7031s3.8398 8.7031 8.7031 8.7031h98.305c4.9922 0 8.5742-3.8398 8.5742-8.7031s-3.5859-8.7031-8.5742-8.7031z"/>
                    </svg>
                </Button>
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
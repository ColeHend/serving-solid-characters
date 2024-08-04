import { Accessor, Component, For, JSX, Show, Signal, createSignal, onMount, onCleanup, Setter, useContext, createMemo } from "solid-js";
import navStyles from './navbar.module.scss';
import useStyle from "../../shared/customHooks/utility/style/styleHook";
import useTabs from "../../shared/customHooks/utility/tabBar";
import { Portal, effect } from "solid-js/web";
import { A } from "@solidjs/router";
import Modal from "../../shared/components/popup/popup.component";
import NavMenu from "./navMenu/navMenu";
import Button, { MenuButton } from "../../shared/components/Button/Button";
import BarMenu from "../../shared/svgs/barMenu";
import { SharedHookContext } from "../rootApp";
import useStyles from "../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../shared/customHooks/userSettings";

type Props = {
    style?: CSSModuleClasses[string],
    siteName?: string,
    links?: Tab[]
    list: [Accessor<boolean>, Setter<boolean>];
    isMobile: boolean;
};

export interface Tab {
    Name: string;
    Link: string;
}

const Navbar: Component<Props> = (props) => {
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyles(userSettings().theme));
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
    const isActiveNav = (button: Tab)=>(pageName() === '/' && button.Link === '/') || (pageName().startsWith(button.Link) && pageName() !== '/' && button.Link !== '/') ? navStyles.active : navStyles.inactive;
    const [showFullList, setShowFullList] = createSignal(false);
    const [settingX, setSettingX] = createSignal(!!props.isMobile ? "6vw" :"93vw");
    effect(()=>{
        if (props.isMobile) setShowFullList(false);
        setSettingX(!!props.isMobile ? "6vw" :"93vw");
    });
    return (
        <div class={`${stylin()?.primary} ${navStyles.navbar}`}>
            <div  class={`${props.style ?? ''}`}>
                <span>
                    <A href="/">
                        MySite
                    </A>
                </span>
                <ul style={props.isMobile ? {margin: "0 auto", width: "min-content"} :{}}>
                        <Show when={props.isMobile}>
                            <li >
                                <div>
                                    <A href="/">
                                        MySite
                                    </A>
                                </div>
                            </li> 
                        </Show>
                    <For each={Buttons}>
                        {(button, i) => (
                                <Show when={!props.isMobile || i() === 0 || showFullList()}>
                                    <li class={`${stylin()?.accent} ${stylin()?.hover} ${isActiveNav(button)}`}>
                                        <A onClick={()=>setPageName(button.Link)} href={button.Link}>{button.Name}</A>
                                    </li>
                                </Show>
                        )}
                    </For>
                </ul>
                <Button onClick={()=>setShowList(old => !old)} >
                    <BarMenu />
                </Button>
            </div>
        </div>
    )
}
export default Navbar;
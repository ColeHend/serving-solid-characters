import { Accessor, Component, For, JSX, Show, Signal, createSignal, onMount, onCleanup, Setter, useContext, createMemo, splitProps } from "solid-js";
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
import { Calculator } from "../../shared/svgs/calulator";
import DamageCalulator from "../../shared/components/modals/damageCalculator/damageCalculator";

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
    const [showDamageCalc,setShowDamageCalc] = createSignal(false);
    const Buttons: Tab[] = [
        {Name: "Home", Link: "/"},
        {Name: "Characters", Link: "/characters"},
        {Name: "Info", Link: "/info"},
        {Name: "Homebrew", Link: "/homebrew"}
    ];
    const [{"list":[showList, setShowList]}, other] = splitProps(props, ["list"]);
    const isActiveNav = (button: Tab)=>(pageName() === '/' && button.Link === '/') || (pageName().startsWith(button.Link) && pageName() !== '/' && button.Link !== '/') ? navStyles.active : navStyles.inactive;
    effect(()=>{
        if (other.isMobile) setShowList(false);
    });
    return (
        <div class={`${stylin()?.primary} ${navStyles.navbar}`}>
            <div  class={`${other.style ?? ''}`}>
                <span>
                    <A href="/">
                        MySite
                    </A>
                </span>
                <ul style={other.isMobile ? {margin: "0 auto", width: "min-content"} :{}}>
                        <Show when={other.isMobile}>
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
                                <Show when={!other.isMobile || i() === 0 || showList()}>
                                    <li class={`${stylin()?.accent} ${stylin()?.hover} ${isActiveNav(button)}`}>
                                        <A onClick={()=>setPageName(button.Link)} href={button.Link}>{button.Name}</A>
                                    </li>
                                </Show>
                        )}
                    </For>
                </ul>

                <div class={`${navStyles.toolBar}`}> 
                    <Button onClick={()=>setShowDamageCalc(!showDamageCalc())} title="damage calculator">
                        <Calculator />
                    </Button>
                </div>

                <Button onClick={()=>setShowList(old => !old)} >
                    <BarMenu />
                </Button>
            </div>


            <Show when={showDamageCalc()}>
                <DamageCalulator setter={setShowDamageCalc} accssor={showDamageCalc} />
            </Show>
        </div>
    )
}
export default Navbar;
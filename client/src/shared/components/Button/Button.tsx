// @ts-nocheck
import { Accessor, Component, createMemo, createSignal, For, JSX, onCleanup, Show } from "solid-js";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import style from "./Button.module.scss";
import Modal from "../popup/popup.component";
import { effect, Portal } from "solid-js/web";
import clickOutside from "../../../shared/customHooks/utility/clickOutside";
import { useInjectServices } from "../../customHooks/injectServices";
import getUserSettings from "../../customHooks/userSettings";
export interface MenuButton {
    name: string,
    condition?: () => boolean,
    action: () => void
}
interface ShowMenu {
    show: boolean,
    lastX: number,
    lastY: number
}
interface Props extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
    menuItems?: MenuButton[],
    overrideX?: string,
    overrideY?: string,
    menuStyle?: CSSModuleClasses[string],
    enableBackgroundClick?: boolean,
    onClick?: (e: MouseEvent) => any,
    transparent?: boolean
    styleType?: "primary" | "accent" | "tertiary"
}

const Button: Component<Props> = (props)=> {
    const [showMenu, setShowMenu] = createSignal<ShowMenu>({show: false, lastX: 0, lastY: 0});
    const isMenuButton = createMemo(()=>!!props.menuItems);
    const filteredMenuItems = createMemo(()=>props.menuItems?.filter(x=>(!!x.condition ? x.condition() : true)) ?? []);
    const sharedHooks = useInjectServices();
    const [userSettings, setUserSettings] = getUserSettings();
    const styleTypeConst = props.styleType ?? "accent";
    const stylin = createMemo(()=>useStyles(userSettings().theme));
    const stylinType = createMemo(()=>stylin()[styleTypeConst]);

    let myRef: HTMLButtonElement;
    let menuRef: HTMLDivElement;
    const menuStyle: Accessor<JSX.CSSProperties> = createMemo(()=>({
        position:"absolute", 
        top: props.overrideY ?? `${showMenu().lastY}px`, 
        left: props.overrideX ?? `${showMenu().lastX > (50 * .9) ? showMenu().lastX - +(!!menuRef ? menuRef.width : '0') : showMenu().lastX}px`,
        display: `${showMenu().show ? "block" : "none"}`
    } as JSX.CSSProperties));
    const outsideFunction = ()=>clickOutside(menuRef, ()=>setShowMenu({show: false, lastX: 0, lastY: 0}));

    if (props.enableBackgroundClick) {
        document.body.addEventListener("click", outsideFunction);
    }
    onCleanup(()=>{
        document.body.removeEventListener("click", outsideFunction);
    }); 
    return (
        <>
            <button
            ref={(el)=>(myRef = el!)}
            onClick={!!props.onClick ? props.onClick : (e)=>(setShowMenu((old)=>({show: !old.show, lastX: e.clientX, lastY: e.clientY})))}
            {...props}
            class={`${stylinType()} ${stylin()?.hover} ${style.customButtonStyle} ${!!props.transparent ? style.transparent : ""} ${props.class ?? ""} `}
            >
                {props.children}
            </button>
            <Portal mount={document.getElementById("root")!}>
                <Show when={showMenu().show && isMenuButton()}>
                    <div ref={(el)=>(menuRef = el!)} class={`${stylin()?.popup} ${stylin()?.primary} ${props.menuStyle ?? ""}`} style={menuStyle()} >
                        <ul class={`${style.menuButtons}`}>
                            <For each={props.menuItems ?? []}>
                                {(button) => (
                                    <Show when={(!!button.condition ? button.condition() : true) && showMenu() && isMenuButton()}>
                                        <li style={{height:`${100 / filteredMenuItems().length}%`}} class={`${stylin().hover}`}>
                                            <button class={`${stylin().accent} ${style.menuButton}`} on:click={button.action}>
                                                {button.name}
                                            </button>
                                        </li>
                                    </Show>
                                )}
                            </For>
                        </ul>
                    </div>
                </Show>
            </Portal>
        </>
    )
}
export { Button };
export default Button;
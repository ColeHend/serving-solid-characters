// @ts-nocheckd
/* use:clickOutside is not actually an error! Solid fixes on compile! */
import { Accessor, Component, createMemo, createSignal, For, JSX, onCleanup, Show } from "solid-js";
import useStyles from "../../../../customHooks/utility/style/styleHook";
import style from "./Button.module.scss";
import Modal from "../../popup/popup.component";
import { effect, Portal } from "solid-js/web";
import clickOutside from "../../../../customHooks/utility/clickOutside";

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
    enableBackgroundClick?: boolean
}

const Button: Component<Props> = (props)=> {
    const [showMenu, setShowMenu] = createSignal<ShowMenu>({show: false, lastX: 0, lastY: 0});
    const isMenuButton = createMemo(()=>!!props.menuItems);
    const filteredMenuItems = createMemo(()=>props.menuItems?.filter(x=>(!!x.condition ? x.condition() : true)) ?? []);
    const stylin = useStyles();

    const menuStyle: Accessor<JSX.CSSProperties> = createMemo(()=>({
        position:"absolute", 
        top: props.overrideY ?? `${showMenu().lastY}px`, 
        left: props.overrideX ?? `${showMenu().lastX}px`,
        display: `${showMenu().show ? "block" : "none"}`
    } as JSX.CSSProperties));
    let myRef: HTMLButtonElement;
    let menuRef: HTMLDivElement;
    if (props.enableBackgroundClick) {
        document.body.addEventListener("click", ()=>clickOutside(menuRef, ()=>setShowMenu({show: false, lastX: 0, lastY: 0})));
    }
    onCleanup(()=>{
        if (props.enableBackgroundClick) {
            document.body.removeEventListener("click", ()=>clickOutside(menuRef, ()=>setShowMenu({show: false, lastX: 0, lastY: 0})));
        }
    });
    return (
        <>
            <button
            ref={(el)=>(myRef = el!)}
            {...props}
            class={`${stylin.accent} ${stylin.hover} ${props.class ?? ""}`}
            onClick={(e)=>(setShowMenu((old)=>({show: !old.show, lastX: e.clientX, lastY: e.clientY})))}
            >
                {props.children}
            </button>
            <Portal mount={document.getElementById("root")!}>
                <Show when={showMenu() && isMenuButton()}>
                    <div ref={(el)=>(menuRef = el!)} class={`${stylin.popup} ${stylin.primary} ${props.menuStyle ?? ""}`} style={menuStyle()} >
                        <ul class={`${style.menuButtons}`}>
                            <For each={props.menuItems}>
                                {(button) => (
                                    <Show when={(!!button.condition ? button.condition() : true) && showMenu() && isMenuButton()}>
                                        <li style={{height:`${100 / filteredMenuItems().length}%`}} class={`${stylin.hover}`}>
                                            <button class={`${stylin.accent} ${style.menuButton}`} onClick={button.action}>
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

export default Button;
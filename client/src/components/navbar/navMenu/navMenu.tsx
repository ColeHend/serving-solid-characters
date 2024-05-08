import { Component, For, Show, createSignal } from "solid-js";
import Modal from "../../popup/popup.component";
import useStyle from "../../../customHooks/utility/style/styleHook";
import menuStyles from "./navMenu.module.scss";

interface MenuButton {
    name: string,
    condition: () => boolean,
    action: () => void
}

const NavMenu: Component = () => {
    const [showMenu, setShowMenu] = createSignal(false);
    const stylin = useStyle(); 

    const menuButtons: MenuButton[] = [
        {
            name: "Login",
            condition: ()=>true,
            action: ()=>{}
        },
        {
            name: "Logout",
            condition: ()=>true,
            action: ()=>{}
        },
        {
            name: "Profile",
            condition: ()=>true,
            action: ()=>{}
        }
    ]

    return (
        <button class={`${stylin.accent} ${stylin.hover}`} onClick={()=>setShowMenu(!showMenu())}>
            {"User\n Menu"}
            <Show when={showMenu()}>
                <Modal width="10%" height="25%" translateX="36vw" translateY="-40vh">
                    <ul class={`${menuStyles.menuButtons}`}>
                        <For each={menuButtons}>
                            {(button) => (
                                <Show when={button.condition()}>
                                    <li style={{height:`${100 / menuButtons.length}%`}} class={`${stylin.hover}`}>
                                        <button class={`${stylin.accent} ${menuStyles.menuButton}`} onClick={button.action}>
                                            {button.name}
                                        </button>
                                    </li>
                                </Show>
                            )}
                        </For>
                    </ul>
                </Modal>
            </Show>
        </button>
    );
};

export default NavMenu;
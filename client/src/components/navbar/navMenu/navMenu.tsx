import { Component, For, Show, createSignal } from "solid-js";
import Modal from "../../../shared/components/popup/popup.component";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import menuStyles from "./navMenu.module.scss";

interface MenuButton {
    name: string,
    condition: () => boolean,
    action: () => void
}

const NavMenu: Component = () => {
    const [showMenu, setShowMenu] = createSignal(false);
    const stylin = useStyle(); 
    const [loggedIn, setLoggedIn] = createSignal(false);
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

    return (
        <>
            <button type="button" class={`${stylin.accent} ${stylin.hover}`} onClick={()=>setShowMenu(old =>!old)}>
                <svg width="32pt" height="32pt" version="1.1" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
                    <path d="m113.15 40.062c4.9922 0 8.5742-3.5859 8.5742-8.4492s-3.5859-8.7031-8.5742-8.7031h-98.176c-4.8633 0-8.7031 3.8398-8.7031 8.7031s3.8398 8.4492 8.7031 8.4492zm-98.176 47.875c-4.8633 0-8.7031 3.8398-8.7031 8.5742s3.8398 8.7031 8.7031 8.7031h98.305c4.9922 0 8.5742-3.9688 8.5742-8.7031s-3.5859-8.5742-8.5742-8.5742zm0-32.641c-4.8633 0-8.7031 3.8398-8.7031 8.7031s3.8398 8.7031 8.7031 8.7031h98.305c4.9922 0 8.5742-3.8398 8.5742-8.7031s-3.5859-8.7031-8.5742-8.7031z"/>
                </svg>        
            </button>
            <Show when={showMenu()}>
                <Modal width="10%" height="25%" translate={{x:"36vw",y:"-40vh"}}  backgroundClick={[showMenu, setShowMenu]} >
                    <ul class={`${menuStyles.menuButtons}`}>
                        <For each={menuButtons}>
                            {(button) => (
                                <Show when={button.condition()}>
                                    <li style={{height:`${100 / menuButtons.filter(x=>x.condition()).length}%`}} class={`${stylin.hover}`}>
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
        </>
    );
};

export default NavMenu;